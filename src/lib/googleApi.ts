import { auth, googleProvider } from "./firebase";
import { signInWithPopup, GoogleAuthProvider } from "firebase/auth";

let cachedAccessToken: string | null = null;

export const setCachedAccessToken = (token: string) => {
  cachedAccessToken = token;
};

export const getGoogleAccessToken = async (): Promise<string> => {
  if (cachedAccessToken) return cachedAccessToken;

  // We need to re-authenticate to get a fresh token if not in memory
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error("Failed to get access token from Google.");
    }
    cachedAccessToken = credential.accessToken;
    return cachedAccessToken;
  } catch (error) {
    console.error("Error getting Google Access Token:", error);
    throw error;
  }
};

export const fetchGoogleContacts = async () => {
  const token = await getGoogleAccessToken();
  const response = await fetch("https://people.googleapis.com/v1/people/me/connections?personFields=names,emailAddresses,phoneNumbers&pageSize=1000", {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!response.ok) {
    throw new Error(`Google Contacts API error: ${response.statusText}`);
  }
  return response.json();
};

export const createGoogleCalendarEvent = async (event: any) => {
  const token = await getGoogleAccessToken();
  const response = await fetch("https://www.googleapis.com/calendar/v3/calendars/primary/events", {
    method: "POST",
    headers: { 
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(event)
  });
  if (!response.ok) {
    throw new Error(`Google Calendar API error: ${response.statusText}`);
  }
  return response.json();
};

export const createGoogleContact = async (contact: any) => {
  const token = await getGoogleAccessToken();
  const response = await fetch("https://people.googleapis.com/v1/people:createContact", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(contact)
  });
  if (!response.ok) {
    throw new Error(`Google Contacts API error: ${response.statusText}`);
  }
  return response.json();
};
