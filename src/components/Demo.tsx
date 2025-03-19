"use client";

import { useEffect, useState } from "react";
import sdk, {
  type Context,
} from "@farcaster/frame-sdk";

import { Button } from "~/components/ui/Button";
import { ButtonSecondary } from "~/components/ui/ButtonSecondary";
import { createStore } from 'mipd'
import { db, signInWithFarcaster, app } from "~/app/firebase";
import SendComplimentModal from "~/pages/sendComplimentModal";
import ViewComplimentsModal from "~/pages/ViewComplimentsModal";
import Image from "next/image";



// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries
import { doc, getDoc, setDoc, collection, query, where, getDocs, limit } from "firebase/firestore";

import { useProfile } from '@farcaster/auth-kit';
import { SignInButton } from '@farcaster/auth-kit';
import { logEvent } from "firebase/analytics";
import { getAnalytics } from "firebase/analytics";

const analytics = getAnalytics(app);


// Function to store user data
async function storeUserData(userId: string, warpcastName: string) {
  const userRef = doc(db, "users", userId);
  const userDoc = await getDoc(userRef);

  if (!userDoc.exists()) {
    await setDoc(userRef, {
      userRef: userId,
      warpcastUsername: warpcastName,
      complimentsSent: 0,
      complimentsReceived: 0,
      createdAt: new Date(),
    });
  }
}

// Add this new component at the top level
function SignInModal() {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 w-[350px] rounded-lg p-6">
        <header className="flex items-center justify-center gap-2 mb-6">
          <Image 
            src="/icon.png" 
            alt="Glow Logo" 
            className="h-6 w-6"
            width={24}
            height={24}
          />
          <span className="text-xl">GLOW</span>
          <sup className="text-xs text-gray-500">Beta</sup>
        </header>
        <h2 className="text-xl font-bold text-center mb-4">Welcome to GLOW</h2>
        <p className="text-center text-gray-600 dark:text-gray-300 mb-6">
          Sign in with Farcaster to send and see your compliments
        </p>
        <div className="flex justify-center">
          <SignInButton />
        </div>
      </div>
    </div>
  );
}

// Example function to log an event
function trackButtonClick() {
  logEvent(analytics, 'main_button_click', { button_name: 'send_compliment' });
}

export default function Demo(
  { title }: { title?: string } = { title: "GLOW - Send anonymous compliments" }
) {
  const [isSDKLoaded, setIsSDKLoaded] = useState(false);
  const [context, setContext] = useState<Context.FrameContext | null>(null);

  //const [added, setAdded] = useState(false);
 // const [notificationDetails, setNotificationDetails] =
 //   useState<FrameNotificationDetails | null>(null);

  const [warpcastName, setWarpcastName] = useState<string>("Unknown Username");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [hasUnreadCompliments, setHasUnreadCompliments] = useState(false);

  // useEffect(() => {
  //   setNotificationDetails(context?.client.notificationDetails ?? null);
  // }, [context]);


  const { profile, isAuthenticated } = useProfile();

  // Update warpcastName when profile changes
  useEffect(() => {
    if (profile?.username) {
      setWarpcastName(profile.username);
    }
  }, [profile]);

  useEffect(() => {
    const load = async () => {
      try {
        const context = await sdk.context;
        setContext(context);
        //setAdded(context?.client?.added ?? false);

        sdk.on("primaryButtonClicked", () => {
          console.log("primaryButtonClicked");
        });

        console.log("Calling ready");
        await sdk.actions.ready();

        // Set up a MIPD Store, and request Providers.
        const store = createStore();

        // Subscribe to the MIPD Store.
        store.subscribe(providerDetails => {
          console.log("PROVIDER DETAILS", providerDetails);
          // => [EIP6963ProviderDetail, EIP6963ProviderDetail, ...]
        });
      } catch (error) {
        console.error("Error initializing SDK:", error);
        // Handle the error appropriately - you might want to show an error message to the user
      }
    };

    if (sdk && !isSDKLoaded) {
      console.log("Calling load");
      setIsSDKLoaded(true);
      load();
      return () => {
        sdk.removeAllListeners();
      };
    }
  }, [isSDKLoaded]);

  useEffect(() => {
    const initializeContext = async () => {
      try {
        const contextData = await sdk.context;
        console.log("Context initialized:", contextData);
        setContext(contextData);

        // Update userId state if contextData contains user information
        if (contextData?.user?.fid) {
          setWarpcastName(contextData.user.username ?? "Unknown Username");
          
          // Sign in with Firebase before storing user data
          const userId = contextData.user.fid.toString();
          const username = contextData.user.username ?? "unknown";
          
          try {
            await signInWithFarcaster(userId, username);
            await storeUserData(userId, username);
          } catch (error) {
            console.error("Error during Firebase authentication:", error);
          }
        }
      } catch (error) {
        console.error("Failed to initialize context:", error);
      }
    };

    initializeContext();
  }, []);

  useEffect(() => {
    const checkUnreadCompliments = async () => {
      // Get username from either context or profile (when using Farcaster auth)
      const currentUsername = profile?.username || context?.user?.username;
      const currentFid = profile?.fid || context?.user?.fid;
      
      if (currentUsername && currentFid) {
        try {
          // Ensure Firebase authentication
          await signInWithFarcaster(currentFid.toString(), currentUsername);
          
          const complimentsRef = collection(db, "compliments");
          const q = query(
            complimentsRef, 
            where("receiver", "==", currentUsername),
            where("isRead", "==", false),
            limit(1)
          );
          const querySnapshot = await getDocs(q);
          console.log("Unread check for", currentUsername, ":", !querySnapshot.empty);
          setHasUnreadCompliments(!querySnapshot.empty);
        } catch (error) {
          console.error("Error checking unread compliments:", error);
        }
      }
    };

    checkUnreadCompliments();
  }, [profile?.username, context?.user?.username, profile?.fid, context?.user?.fid]);

  // If we're not in Warpcast and not authenticated, show the sign-in modal
  if (!context?.user?.username && !isAuthenticated) {
    return <SignInModal />;
  }

  if (!isSDKLoaded) {
    return <div>Loading...</div>;
  }

  return (
    <div style={{ 
      paddingTop: context?.client.safeAreaInsets?.top ?? 0, 
      paddingBottom: context?.client.safeAreaInsets?.bottom ?? 0,
      paddingLeft: context?.client.safeAreaInsets?.left ?? 0,
      paddingRight: context?.client.safeAreaInsets?.right ?? 0 ,
    }}>
      <header className="w-[350px] mx-auto flex items-center justify-center gap-2 py-4 pt-11">
        <Image 
          src="/icon.png" 
          alt="Glow Logo" 
          className="h-6 w-6"
          width={24}
          height={24}
        />
        <span className="text-xl">GLOW</span>
        <sup className="text-xs text-gray-500">Beta</sup>
      </header>
        <div className="w-[350px] mx-auto py-2 px-2">
          

        <h2 className="text-xl font-bold text-center full-width">Send <span className="underline">anonym</span> compliments</h2>
        <div className="mb-4 text-center">...to anyone on Warpcast.</div>
        {context?.user?.username && (
          <h2 className="font-medium font-bold mb-10 text-center">Hello, <span style={{fontWeight: "bold"}}>{warpcastName}</span>.</h2>
        )}

        {!context?.user?.username && (
          <div className="flex justify-center mb-4">
            {!isAuthenticated ? (
              <SignInButton />
            ) : (
              <div className="px-4 py-2 bg-white text-black rounded-md">
                <h2 className="font-medium font-bold mb-10 text-center">Hello, <span style={{fontWeight: "bold"}}>{profile?.username}</span></h2>
              </div>
            )}
          </div>
        )}
        <h1 className="text-2xl font-bold text-center mb-4">{title}</h1>

        <div className="mb-4">
          <p className="text-center mb-2">Brighten someone&apos;s day! ✉️</p>
          <Button onClick={() => {
            setIsModalOpen(true);
            trackButtonClick();
          }} className="font-bold">
            Send
          </Button>
          <br />
          <p className="text-center mb-2">View your compliments 👇</p>
          <ButtonSecondary 
            onClick={() => setIsViewModalOpen(true)} 
            className="relative inline-block font-bold"
          >
            View
            {hasUnreadCompliments && (
              <span className="absolute -right-2 -top-2 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full z-10">
                NEW
              </span>
            )}
          </ButtonSecondary>
          <br />
          <div className="mb-4">
          <br />

          </div>


        </div>

        {/* Footer */}
        <footer className="mt-8 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="text-center text-sm text-gray-500 dark:text-gray-400">
            <p>Made by <a href="https://warpcast.com/tamastorok.eth" target="_blank" rel="noopener noreferrer" className=" hover:text-blue-600">@torok_tomi</a>. Icon by <a href="https://www.flaticon.com/authors/najmunnahar" target="_blank" rel="noopener noreferrer" className="hover:text-blue-600">NajmunNahar</a>.</p>
          </div>
        </footer>

        <SendComplimentModal 
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          context={context}
        />
        
        <ViewComplimentsModal 
          isOpen={isViewModalOpen}
          onClose={() => setIsViewModalOpen(false)}
          context={context}
        />
      </div>
    </div>
  );
}



