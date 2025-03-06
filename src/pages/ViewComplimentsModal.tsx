"use client";

import React, { useState, useEffect } from "react";
import { ButtonThird } from "~/components/ui/ButtonThird";
import { type Context } from "@farcaster/frame-sdk";
import { db } from "~/app/firebase";
import { collection, query, where, getDocs, doc, updateDoc, getDoc } from "firebase/firestore";
import Image from "next/image";
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
}

export default function ViewComplimentsModal({ isOpen, onClose, context }: ViewComplimentsModalProps) {
  const [activeTab, setActiveTab] = useState("Received");
  const [sentCompliments, setSentCompliments] = useState<Compliment[]>([]);
  const [receivedCompliments, setReceivedCompliments] = useState<Compliment[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  useEffect(() => {
    if (isOpen) {
      setActiveTab("Received");
      fetchReceivedCompliments();
    }
  }, [isOpen, context?.user?.username]);

  const fetchReceivedCompliments = async () => {
    if (!context?.user?.username) return;
    
    setLoading(true);
    try {
      const q = query(
        collection(db, "compliments"),
        where("receiver", "==", context.user.username)
      );
      
      const querySnapshot = await getDocs(q);
      console.log('Fetched compliments:', querySnapshot.docs.map(doc => ({
        id: doc.id,
        data: doc.data()
      })));
      
      const compliments = querySnapshot.docs.map(doc => ({
        ...doc.data(),
        complimentID: doc.id,
        timestamp: doc.data().timestamp?.toDate(),
      })) as Compliment[];
      
      // Sort compliments by timestamp in descending order (newest first)
      const sortedCompliments = compliments.sort((a, b) => 
        (b.timestamp?.getTime() ?? 0) - (a.timestamp?.getTime() ?? 0)
      );
      
      console.log('Processed compliments:', sortedCompliments);
      setReceivedCompliments(sortedCompliments);
    } catch (error) {
      console.error("Error fetching received compliments:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSentCompliments = async () => {
    if (!context?.user?.username) return;
    
    setLoading(true);
    try {
      const q = query(
        collection(db, "compliments"),
        where("sender", "==", context.user.username)
      );
      
      const querySnapshot = await getDocs(q);
      const compliments = querySnapshot.docs.map(doc => ({
        ...doc.data(),
        complimentID: doc.id,
        timestamp: doc.data().timestamp?.toDate(),
      })) as Compliment[];
      
      // Sort compliments by timestamp in descending order (newest first)
      const sortedCompliments = compliments.sort((a, b) => 
        (b.timestamp?.getTime() ?? 0) - (a.timestamp?.getTime() ?? 0)
      );
      
      setSentCompliments(sortedCompliments);
    } catch (error) {
      console.error("Error fetching sent compliments:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setSelectedIndex(null); // Reset selection when changing tabs
    if (activeTab === "Sent") {
      fetchSentCompliments();
    } else if (activeTab === "Received") {
      fetchReceivedCompliments();
    }
  }, [activeTab, context?.user?.username]);

  const handleComplimentClick = async (compliment: Compliment, index: number) => {
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
        console.error("Compliment data:", compliment);
      }
    } else {
      console.log('Skipping update:', { 
        isRead: compliment.isRead, 
        activeTab, 
        complimentID: compliment.complimentID 
      });
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
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">My Compliments</h2>
        </div>

        <div className="flex w-full mb-4">
          <button
            className={`flex-1 px-4 py-2 rounded-l ${activeTab === "Received" ? "bg-[#FFC024] text-black border-2 border-[#000000] border-r-0"  : "bg-[#FFFFF] text-black border-2 border-[#000000]"}`}
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

        <div className="flex-1 overflow-y-auto">
          {activeTab === "Received" && (
            <ul className="space-y-2">
              {loading ? (
                <li>Loading...</li>
              ) : receivedCompliments.length > 0 ? (
                receivedCompliments.map((compliment, index) => (
                  <li 
                    key={index}
                        className={`p-2 border-2 border-[#000000] rounded cursor-pointer transition-all duration-200  ${
                        selectedIndex === index 
                        ? "bg-[#FFD56F] dark:bg-gray-700" 
                        : !compliment.isRead
                        ? "bg-[#FFD56F]"
                        : "hover:bg-gray-100 dark:hover:bg-gray-700"
                    } ${!compliment.isRead ? "border-l-4 border-l-blue-500" : ""}`}
                    onClick={() => handleComplimentClick(compliment, index)}
                  >
                    <div className="flex justify-between items-center">
                      <p className="font-medium">You received a secret compliment!</p>
                      {!compliment.isRead && (
                        <span className="text-xs font-bold text-white bg-red-500 px-2 py-1 rounded">NEW</span>
                      )}
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mt-2">{compliment.timestamp?.toLocaleDateString()}</p>
                      </div>
                    {selectedIndex === index && (
                      <>
                        <p className="mt-1 text-gray-500 dark:text-gray-300 p-3 bg-white dark:bg-gray-800 rounded border border-blue-200 dark:border-gray-600">
                          {compliment.compliment}

                        </p>
                      </>
                    )}

                  </li>
                ))
              ) : (
                <li>No compliments received yet</li>
              )}
            </ul>
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

        <div className="mt-4 flex justify-end">
          <ButtonThird onClick={onClose}>Close</ButtonThird>
        </div>
      </div>
    </div>
  );
}