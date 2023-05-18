import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
	apiKey: "AIzaSyCvCJfpHBWAp35tkBCoCa-ZIzPLODbK9js",
	authDomain: "weatherspot-90846.firebaseapp.com",
	projectId: "weatherspot-90846",
	storageBucket: "weatherspot-90846.appspot.com",
	messagingSenderId: "35976013044",
	appId: "1:35976013044:web:8ac2045927a29ac04b2aa1",
	measurementId: "G-KLXCEXHJG5",
};

const app = initializeApp(firebaseConfig);

const db = getFirestore(app);

export { db };
