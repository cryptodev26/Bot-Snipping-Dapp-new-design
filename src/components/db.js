import firebase from 'firebase';


const firebaseConfig = {
  apiKey: "AIzaSyBrEGFuN4EOqRO1s1mFcS5FxRPP1P7qLV4",
  authDomain: "contract-accac.firebaseapp.com",
  projectId: "contract-accac",
  storageBucket: "contract-accac.appspot.com",
  messagingSenderId: "838622596091",
  appId: "1:838622596091:web:5dc1f4c9badde9dd8f195e",
  measurementId: "G-RCTWBSF61W",
};

firebase.initializeApp(firebaseConfig);
firebase.analytics();

export default firebase;
export const database = firebase.database();
export const auth = firebase.auth();
export const storage = firebase.storage();
export const googleAuthProvider = new firebase.auth.GoogleAuthProvider();
