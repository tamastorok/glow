"use client";

import React, { useState, useEffect } from "react";
import { ButtonSecondary } from "~/components/ui/ButtonSecondary";
import { type Context } from "@farcaster/frame-sdk";
import { db } from "~/app/firebase";
import { collection, query, where, getDocs, doc, updateDoc, getDoc } from "firebase/firestore";
import Image from "next/image";
import { useProfile } from '@farcaster/auth-kit';
import { FirebaseError } from 'firebase/app';
import { auth, signInWithFarcaster } from "~/app/firebase";

import { baseUSDC } from '@daimo/contract'
import { DaimoPayButton } from '@daimo/pay'
import { getAddress } from 'viem'

interface ViewComplimentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  context: Context.FrameContext | null;
}

interface Compliment {
  sender: string;
  receiver: string;
  compliment: string;
  timestamp: Date;
  isRead: boolean;
  complimentID: string;
  rating?: number;
}

export default function ViewComplimentsModal({ isOpen, onClose, context }: ViewComplimentsModalProps) {
  const [activeTab, setActiveTab] = useState("Received");
  const [sentCompliments, setSentCompliments] = useState<Compliment[]>([]);
  const [receivedCompliments, setReceivedCompliments] = useState<Compliment[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const { profile } = useProfile();

  // Get the username from either context or profile
  const username = context?.user?.username || profile?.username;

  // Check if user is authenticated
  const isAuthenticated = Boolean(username);

  // Calculate compliments sent in last 24h from sentCompliments
  const complimentsSentLast24h = sentCompliments.filter(compliment => {
    const last24h = new Date();
    last24h.setHours(last24h.getHours() - 24);
    return compliment.timestamp >= last24h;
  }).length;

  // Function to get number of viewable compliments based on sent compliments
  const getViewableComplimentsCount = (sentCount: number) => {
    return sentCount >= 2 ? Infinity : 0; // Can view all compliments if sent 2 or more, otherwise none
  };

  // Fetch both sent and received compliments when modal opens
  useEffect(() => {
    const fetchData = async () => {
      if (isOpen && isAuthenticated && username) {
        setLoading(true);
        try {
          console.log('Starting to fetch compliments for:', {
            username,
            isAuthenticated,
            auth: auth.currentUser?.uid
          });

          // Ensure user is authenticated with Firebase
          if (!auth.currentUser) {
            console.log('No Firebase user, attempting to sign in...');
            const fid = profile?.fid || context?.user?.fid;
            if (fid) {
              try {
                await signInWithFarcaster(fid.toString(), username);
                console.log('Firebase sign in successful');
              } catch (error) {
                console.error('Firebase sign in failed:', error);
                return;
              }
            }
          }

          // Fetch sent compliments
          const sentQuery = query(
            collection(db, "compliments"),
            where("sender", "==", username)
          );
          
          const sentSnapshot = await getDocs(sentQuery);
          console.log('Sent compliments query result:', {
            size: sentSnapshot.size,
            username,
            authState: auth.currentUser?.uid
          });

          const sentDocs = sentSnapshot.docs.map(doc => ({
            ...doc.data(),
            complimentID: doc.id,
            timestamp: doc.data().timestamp?.toDate(),
          })) as Compliment[];
          
          // Sort by timestamp (newest first)
          const sortedSentCompliments = sentDocs.sort((a, b) => 
            (b.timestamp?.getTime() ?? 0) - (a.timestamp?.getTime() ?? 0)
          );
          setSentCompliments(sortedSentCompliments);

          // Fetch received compliments
          const receivedQuery = query(
            collection(db, "compliments"),
            where("receiver", "==", username)
          );
          
          const receivedSnapshot = await getDocs(receivedQuery);
          console.log('Received compliments query result:', {
            size: receivedSnapshot.size,
            username,
            authState: auth.currentUser?.uid
          });

          const receivedDocs = receivedSnapshot.docs.map(doc => ({
            ...doc.data(),
            complimentID: doc.id,
            timestamp: doc.data().timestamp?.toDate(),
          })) as Compliment[];
          
          // Sort by timestamp (newest first)
          const sortedReceivedCompliments = receivedDocs.sort((a, b) => 
            (b.timestamp?.getTime() ?? 0) - (a.timestamp?.getTime() ?? 0)
          );
          setReceivedCompliments(sortedReceivedCompliments);
        } catch (error) {
          console.error("Error fetching compliments:", error);
          if (error instanceof FirebaseError) {
            console.error("Firebase error details:", {
              code: error.code,
              message: error.message,
              stack: error.stack,
              auth: auth.currentUser?.uid,
              username
            });
          }
        } finally {
          setLoading(false);
        }
      }
    };

    fetchData();
  }, [isOpen, isAuthenticated, username, context?.user?.fid, profile?.fid]);

  // Reset selection when changing tabs
  useEffect(() => {
    setSelectedIndex(null);
  }, [activeTab]);

  const handleComplimentClick = async (compliment: Compliment, index: number) => {
    if (!isAuthenticated || !username) return;
    
    setSelectedIndex(selectedIndex === index ? null : index);
    
    if (!compliment.isRead && activeTab === "Received") {
      try {
        console.log('Attempting to update compliment:', compliment.complimentID);
        const complimentRef = doc(db, "compliments", compliment.complimentID);
        
        // First verify if the document exists
        const complimentDoc = await getDoc(complimentRef);
        if (!complimentDoc.exists()) {
          console.error('Compliment document does not exist:', compliment.complimentID);
          return;
        }
        
        // Verify the user is the receiver
        if (complimentDoc.data().receiver !== username) {
          console.error('User is not authorized to update this compliment');
          return;
        }
        
        console.log('Current document data:', complimentDoc.data());
        
        await updateDoc(complimentRef, {
          isRead: true
        });
        
        console.log('Successfully updated isRead status');
        
        // Update the local state to reflect the change
        const updatedCompliments = [...receivedCompliments];
        updatedCompliments[index] = { ...compliment, isRead: true };
        setReceivedCompliments(updatedCompliments);
      } catch (error) {
        console.error("Error updating compliment read status:", error);
        if (error instanceof FirebaseError && error.code === 'permission-denied') {
          console.error("Authentication error: User does not have permission to update this compliment");
        } else {
          console.error("Unexpected error:", error instanceof Error ? error.message : String(error));
        }
      }
    } else {
      console.log('Skipping update:', { 
        isRead: compliment.isRead, 
        activeTab, 
        complimentID: compliment.complimentID 
      });
    }
  };

  const handleRatingClick = async (compliment: Compliment, rating: number, index: number) => {
    if (!isAuthenticated || !username) return;
    
    try {
      const complimentRef = doc(db, "compliments", compliment.complimentID);
      
      // First verify if the document exists and user is the receiver
      const complimentDoc = await getDoc(complimentRef);
      if (!complimentDoc.exists() || complimentDoc.data().receiver !== username) {
        console.error('User is not authorized to rate this compliment');
        return;
      }
      
      await updateDoc(complimentRef, {
        rating: rating
      });
      
      // Update local state
      const updatedCompliments = [...receivedCompliments];
      updatedCompliments[index] = { ...compliment, rating };
      setReceivedCompliments(updatedCompliments);
    } catch (error) {
      console.error("Error updating compliment rating:", error);
      if (error instanceof FirebaseError && error.code === 'permission-denied') {
        console.error("Authentication error: User does not have permission to rate this compliment");
      } else {
        console.error("Unexpected error:", error instanceof Error ? error.message : String(error));
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 w-full h-full md:rounded-lg p-6 flex flex-col">
        <header className="flex items-center justify-center gap-2 py-4">
          <div className="grid grid-cols-3 items-center mb-4">
            <div className="col-start-1"></div>
            <div className="flex items-center gap-1 justify-center col-start-2">
              <Image 
                src="/icon.png" 
                alt="Glow Logo" 
                className="h-6 w-6"
                width={24}
                height={24}
              />
              <span className="text-xl">GLOW</span>
              <sup className="text-xs text-gray-500">Beta</sup>
            </div>
            <div className="flex justify-end col-start-3">
              <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl">×</button>
            </div>
          </div>
        </header>
        <div className="mx-auto flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">My Compliments</h2>
        </div>

        {!isAuthenticated ? (
          <div className="text-center text-gray-500">
            Please log in to view your compliments
          </div>
        ) : (
          <>
            <div className="w-[350px] mx-auto flex mb-4">
              <button
                className={`flex-1 px-4 py-2 rounded-l ${activeTab === "Received" ? "bg-[#FFC024] text-black border-2 border-[#000000] border-r-0" : "bg-[#FFFFF] text-black border-2 border-[#000000]"}`}
                onClick={() => setActiveTab("Received")}
              >
                Received
              </button>
              <button
                className={`flex-1 px-4 py-2 rounded-r ${activeTab === "Sent" ? "bg-[#FFC024] text-black border-2 border-[#000000] border-l-0" : "bg-[#FFFFF] text-black border-2 border-[#000000]"}`}
                onClick={() => setActiveTab("Sent")}
              >
                Sent
              </button>
            </div>

            <div className="w-[350px] mx-auto flex-1 overflow-y-auto">
              {activeTab === "Received" && (
                <div>
                  <div>
                    <div className="flex flex-col gap-4 mb-4">
                      <div className="flex items-center gap-1 text-sm text-gray-500">
                        {complimentsSentLast24h >= 2 ? (
                          <span>You can view all compliments! 🎉</span>
                        ) : (
                          <span>Send {2 - complimentsSentLast24h} more {complimentsSentLast24h === 1 ? 'compliment' : 'compliments'} to unlock all messages!</span>
                        )}
                      </div>
                      {complimentsSentLast24h < 2 && (
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <span>Or unlock all with</span>
                          <DaimoPayButton.Custom
                            appId="pay-demo"
                            toChain={8453}
                            toUnits="0.19"
                            toToken={getAddress(baseUSDC.token)}
                            toAddress="0xAbE4976624c9A6c6Ce0D382447E49B7feb639565"
                            onPaymentStarted={(e) => console.log(e)}
                            onPaymentCompleted={(e) => console.log(e)}
                            paymentOptions={["Coinbase"]}
                            preferredChains={[8453]}
                          >
                            {({ show }) => <button onClick={show} style={{ backgroundColor: "#FFC024", color: "#000000", borderRadius: "5px", padding: "5px 10px" }}>0.19$</button>}
                          </DaimoPayButton.Custom>
                        </div>
                      )}
                    </div>
                  </div>
                  <ul className="space-y-2">
                    {loading ? (
                      <li>Loading...</li>
                    ) : receivedCompliments.length > 0 ? (
                      receivedCompliments.map((compliment, index) => {
                        // Check if this compliment should be viewable
                        const viewableCount = getViewableComplimentsCount(complimentsSentLast24h);
                        const isLocked = !compliment.isRead && index >= viewableCount;

                        return (
                          <li 
                            key={index}
                            className={`p-2 border-2 border-[#000000] rounded cursor-pointer transition-all duration-200  ${
                              selectedIndex === index 
                                ? "bg-[#FFF] dark:bg-[#F1f1f1]" 
                                : !compliment.isRead
                                ? "bg-[#FFF]"
                                : "hover:bg-gray-100 dark:hover:bg-gray-700"
                            } ${!compliment.isRead ? "border-l-2 border-yellow-500" : ""}`}
                            onClick={() => !isLocked && handleComplimentClick(compliment, index)}
                          >
                            <div className="flex justify-between items-center">
                              <p className="font-medium">You received a secret compliment!</p>
                              {!compliment.isRead && (
                                <span className={`text-xs font-bold text-white ${isLocked ? "bg-gray-500" : "bg-red-500"} px-2 py-1 rounded`}>
                                  {isLocked ? "LOCKED" : "NEW"}
                                </span>
                              )}
                            </div>
                            <div>
                              <p className="text-sm text-gray-500 mt-2">{compliment.timestamp?.toLocaleDateString()}</p>
                            </div>
                            {selectedIndex === index && !isLocked && (
                              <>
                                <p className="mt-1 text-gray-500 dark:text-gray-300 p-3 bg-white dark:bg-gray-800 rounded border border-blue-200 dark:border-gray-600">
                                  {compliment.compliment}
                                </p>
                                <div className="mt-3 flex items-center gap-1">
                                  <p className="text-gray-500">Rate it: </p>
                                  {[1, 2, 3, 4, 5].map((star) => (
                                    <button
                                      key={star}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleRatingClick(compliment, star, index);
                                      }}
                                      className={`text-2xl ${
                                        compliment.rating && star <= compliment.rating
                                          ? "text-yellow-400"
                                          : "text-gray-300"
                                      } hover:text-yellow-400 transition-colors`}
                                    >
                                      ★
                                    </button>
                                  ))}
                                  {compliment.rating && (
                                    <span className="ml-2 text-sm text-gray-500">
                                      ({compliment.rating}/5)
                                    </span>
                                  )}
                                </div>
                              </>
                            )}
                            {isLocked && (
                              <p className="mt-2 text-sm text-gray-500">
                                Send more compliments to unlock this message!
                              </p>
                            )}
                          </li>
                        );
                      })
                    ) : (
                      <li>No compliments received yet</li>
                    )}
                  </ul>
                </div>
              )}
              {activeTab === "Sent" && (
                <ul className="space-y-2">
                  {loading ? (
                    <li>Loading...</li>
                  ) : sentCompliments.length > 0 ? (
                    sentCompliments.map((compliment, index) => (
                      <li 
                        key={index} 
                        className={`p-2 border-2 border-[#000000] rounded cursor-pointer transition-all duration-200 ${
                          selectedIndex === index 
                            ? "bg-[#FFD56F] dark:bg-gray-700" 
                            : "hover:bg-gray-100 dark:hover:bg-gray-700"
                        }`}
                        onClick={() => handleComplimentClick(compliment, index)}
                      >
                        <p className="font-medium">To: {compliment.receiver}</p>
                        {selectedIndex === index && (
                          <>
                            <p className="mt-3 text-gray-600 dark:text-gray-300">Message:</p>
                            <p className="mt-1 text-blue-600 dark:text-blue-400 p-3 bg-white dark:bg-gray-800 rounded border border-blue-200 dark:border-gray-600">
                              {compliment.compliment}
                            </p>
                          </>
                        )}
                        <p className="text-sm text-gray-500 mt-2">
                          {compliment.timestamp?.toLocaleDateString()}
                        </p>
                      </li>
                    ))
                  ) : (
                    <li>No compliments sent yet</li>
                  )}
                </ul>
              )}
            </div>

            <div className="w-[350px] mx-auto mt-4 flex justify-end">
              <ButtonSecondary onClick={onClose}>Close</ButtonSecondary>
            </div>
          </>
        )}
      </div>
    </div>
  );
}