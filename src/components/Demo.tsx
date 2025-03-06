"use client";

import { useEffect, useCallback, useState } from "react";
import { signIn, signOut, getCsrfToken } from "next-auth/react";
import sdk, {
  FrameNotificationDetails,
  SignIn as SignInCore,
  type Context,
} from "@farcaster/frame-sdk";
import {
  useAccount,
  useDisconnect,
  useConnect,
  useChainId,
} from "wagmi";

import { config } from "~/components/providers/WagmiProvider";
import { Button } from "~/components/ui/Button";
import { ButtonSecondary } from "~/components/ui/ButtonSecondary";
import { ButtonThird } from "~/components/ui/ButtonThird";
import { truncateAddress } from "~/lib/truncateAddress";
import { useSession } from "next-auth/react"
import { createStore } from 'mipd'
import { db } from "~/app/firebase";
import SendComplimentModal from "~/pages/sendComplimentModal";
import ViewComplimentsModal from "~/pages/ViewComplimentsModal";
import Image from "next/image";


// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries
import { doc, getDoc, setDoc, collection, query, where, getDocs, limit } from "firebase/firestore";



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


export default function Demo(
  { title }: { title?: string } = { title: "Frames v2 Demo" }
) {
  const [isSDKLoaded, setIsSDKLoaded] = useState(false);
  const [context, setContext] = useState<Context.FrameContext | null>(null);
  const [isContextOpen, setIsContextOpen] = useState(false);

  const [added, setAdded] = useState(false);
  const [notificationDetails, setNotificationDetails] =
    useState<FrameNotificationDetails | null>(null);

  const [warpcastName, setWarpcastName] = useState<string>("Unknown Username");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [hasUnreadCompliments, setHasUnreadCompliments] = useState(false);

  useEffect(() => {
    setNotificationDetails(context?.client.notificationDetails ?? null);
  }, [context]);

  const { address, isConnected } = useAccount();
  const chainId = useChainId();

  const { disconnect } = useDisconnect();
  const { connect } = useConnect();


  useEffect(() => {
    const load = async () => {
      const context = await sdk.context;
      setContext(context);
      setAdded(context?.client?.added ?? false);

      sdk.on("primaryButtonClicked", () => {
        console.log("primaryButtonClicked");
      });

      console.log("Calling ready");
      sdk.actions.ready({});

// Set up a MIPD Store, and request Providers.
const store = createStore()

// Subscribe to the MIPD Store.
store.subscribe(providerDetails => {
  console.log("PROVIDER DETAILS", providerDetails)
  // => [EIP6963ProviderDetail, EIP6963ProviderDetail, ...]
})

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
        }

        // Call storeUserData when the app is opened
        const userId = contextData?.user?.fid?.toString() ?? "unknown";
        const warpcastName = contextData?.user?.username ?? "unknown";
        await storeUserData(userId, warpcastName);

      } catch (error) {
        console.error("Failed to initialize context:", error);
      }
    };

    initializeContext();
  }, []); // Empty dependency array ensures this runs once on mount

  useEffect(() => {
    const checkUnreadCompliments = async () => {
      if (context?.user?.username) {
        try {
          const complimentsRef = collection(db, "compliments");
          const q = query(
            complimentsRef, 
            where("receiver", "==", context.user.username),
            where("isRead", "==", false),
            limit(1)
          );
          const querySnapshot = await getDocs(q);
          console.log("Unread check:", !querySnapshot.empty); // Debug log
          setHasUnreadCompliments(!querySnapshot.empty);
        } catch (error) {
          console.error("Error checking unread compliments:", error);
        }
      }
    };

    checkUnreadCompliments();
  }, [context]); // Add context as a dependency

  const close = useCallback(() => {
    sdk.actions.close();
  }, []);


  const toggleContext = useCallback(() => {
    setIsContextOpen((prev) => !prev);
  }, []);


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
      <header className="flex items-center justify-center gap-2 py-4 pt-11">
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
        <div className="w-[300px] mx-auto py-2 px-2">
          

        <h2 className="text-xl font-bold text-center full-width">Send <span className="underline">anonym</span> compliments</h2>
        <div className="mb-4 text-center">...to anyone on Warpcast.</div>
        <h2 className="font-medium font-bold mb-10 text-center">Hello, <span style={{fontWeight: "bold"}}>{warpcastName}</span>.</h2>

        <h1 className="text-2xl font-bold text-center mb-4">{title}</h1>

        <div className="mb-4">
          <p className="text-center mb-2">Brighten someone&apos;s day! ✉️</p>
          <Button onClick={() => setIsModalOpen(true)} className="font-bold">
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

            <ButtonThird onClick={close} className="font-bold">Close Frame</ButtonThird>
          </div>



          <h2 className="font-2xl font-bold">Context</h2>
          <button
            onClick={toggleContext}
            className="flex items-center gap-2 transition-colors"
          >
            <span
              className={`transform transition-transform ${
                isContextOpen ? "rotate-90" : ""
              }`}
            >
              ➤
            </span>
            Tap to expand
          </button>

          {isContextOpen && (
            <div className="p-4 mt-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
              <pre className="font-mono text-xs whitespace-pre-wrap break-words max-w-[260px] overflow-x-">
                {JSON.stringify(context, null, 2)}
              </pre>
            </div>
          )}
        </div>

        <div>
          <h2 className="font-2xl font-bold">Actions</h2>

          <div className="mb-4">
            <SignIn />
          </div>
        </div>

        <div>
          <h2 className="font-2xl font-bold">Wallet</h2>

          {address && (
            <div className="my-2 text-xs">
              Address: <pre className="inline">{truncateAddress(address)}</pre>
            </div>
          )}

          {chainId && (
            <div className="my-2 text-xs">
              Chain ID: <pre className="inline">{chainId}</pre>
            </div>
          )}


          <div className="mb-4">
            <Button
              onClick={() =>
                isConnected
                  ? disconnect()
                  : connect({ connector: config.connectors[0] })
              }
            >
              {isConnected ? "Disconnect" : "Connect"}
            </Button>
          </div>
        </div>

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

function SignIn() {
  const [signingIn, setSigningIn] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [signInResult, setSignInResult] = useState<SignInCore.SignInResult>();
  const [signInFailure, setSignInFailure] = useState<string>();
  const { data: session, status } = useSession()

  const getNonce = useCallback(async () => {
    const nonce = await getCsrfToken();
    if (!nonce) throw new Error("Unable to generate nonce");
    return nonce;
  }, []);

  const handleSignIn = useCallback(async () => {
    try {
      setSigningIn(true);
      setSignInFailure(undefined);
      const nonce = await getNonce();
      const result = await sdk.actions.signIn({ nonce });


      setSignInResult(result);

      await signIn("credentials", {
        message: result.message,
        signature: result.signature,
        redirect: false,
      });

    } catch (e) {
      if (e instanceof SignInCore.RejectedByUser) {
        setSignInFailure("Rejected by user");
        return;
      }

      setSignInFailure("Unknown error");
    } finally {
      setSigningIn(false);
    }
  }, [getNonce]);

  const handleSignOut = useCallback(async () => {
    try {
      setSigningOut(true);
      await signOut({ redirect: false }) 
      setSignInResult(undefined);
    } finally {
      setSigningOut(false);
    }
  }, []);

  return (
    <>
      {status !== "authenticated" &&
        <Button
          onClick={handleSignIn}
          disabled={signingIn}
        >
          Sign In with Farcaster
        </Button>
      }
      {status === "authenticated" &&
        <Button
          onClick={handleSignOut}
          disabled={signingOut}
        >
          Sign out
        </Button>
      }
      {session &&
        <div className="my-2 p-2 text-xs overflow-x-scroll bg-gray-100 rounded-lg font-mono">
          <div className="font-semibold text-gray-500 mb-1">Session</div>
          <div className="whitespace-pre">{JSON.stringify(session, null, 2)}</div>
        </div>
      }
      {signInFailure && !signingIn && (
        <div className="my-2 p-2 text-xs overflow-x-scroll bg-gray-100 rounded-lg font-mono">
          <div className="font-semibold text-gray-500 mb-1">SIWF Result</div>
          <div className="whitespace-pre">{signInFailure}</div>
        </div>
      )}
      {signInResult && !signingIn && (
        <div className="my-2 p-2 text-xs overflow-x-scroll bg-gray-100 rounded-lg font-mono">
          <div className="font-semibold text-gray-500 mb-1">SIWF Result</div>
          <div className="whitespace-pre">{JSON.stringify(signInResult, null, 2)}</div>
        </div>
      )}
    </>
  );
}

// Instead, create a function to call your API
const fetchNeynarData = async () => {
  const response = await fetch('/api/neynar');
  return response.json();
};
