import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';
import { getAuth } from 'firebase/auth';

// Firebase configuration and setting api key and other
const firebaseConfig = {
    apiKey: "AIzaSyCXeWHMdTrzGbLB3EZHHMepgT4BAQlIbWk",
    authDomain: "moba-draft-system.firebaseapp.com",
    databaseURL: "https://moba-draft-system-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "moba-draft-system",
    storageBucket: "moba-draft-system.firebasestorage.app",
    messagingSenderId: "370366977564",
    appId: "1:370366977564:web:29200aebd31737aa1c71d9",
    measurementId: "G-EVGWDGV60N"
};

// Init Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);
const auth = getAuth(app);

export { app, database, auth };