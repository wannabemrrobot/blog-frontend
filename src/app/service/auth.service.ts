import { Injectable } from '@angular/core';
import { initializeApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GithubAuthProvider,
  onAuthStateChanged,
  signOut,
  Auth,
  User
} from 'firebase/auth';
import { BehaviorSubject, Observable } from 'rxjs';

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyBvG4ZKL_4qWwEAC87Hjnoef2LyIL9mNGA",
  authDomain: "wannabemrrobot.firebaseapp.com",
  projectId: "wannabemrrobot",
  storageBucket: "wannabemrrobot.firebasestorage.app",
  messagingSenderId: "988617728225",
  appId: "1:988617728225:web:a57262ecb74f1f365357a0"
};

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private auth: Auth;
  private currentUserSubject = new BehaviorSubject<any>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor() {
    // Initialize Firebase
    const app = initializeApp(firebaseConfig);
    this.auth = getAuth(app);

    // Listen for auth state changes
    onAuthStateChanged(this.auth, async (user: User | null) => {
      if (user) {
        // Fetch GitHub user info
        const token = await user.getIdTokenResult();
        
        // Extract GitHub username from providerData
        const githubProvider = user.providerData.find(p => p.providerId === 'github.com');
        let githubUsername = '';
        
        if (githubProvider && githubProvider.uid) {
          // GitHub uid is typically in format "12345678" (just the numeric ID)
          // We need to fetch the username via the access token or from reloadUserInfo
          githubUsername = (user as any).reloadUserInfo?.screenName || '';
        }
        
        // If still empty, try to parse from displayName
        if (!githubUsername && user.displayName) {
          githubUsername = user.displayName.toLowerCase().replace(/\s+/g, '');
        }
        
        const githubUser = {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
          login: githubUsername,
          token: token.token
        };
        
        console.log('Auth State Changed:', githubUser);
        this.currentUserSubject.next(githubUser);
      } else {
        this.currentUserSubject.next(null);
      }
    });
  }

  async signInWithGitHub(): Promise<any> {
    const provider = new GithubAuthProvider();
    // Request additional scope for user profile and read user data
    provider.addScope('user:email');
    provider.addScope('read:user');
    provider.addScope('repo'); // Add repo scope to access repository contents
    
    const result = await signInWithPopup(this.auth, provider);
    
    // Get GitHub access token
    const credential = GithubAuthProvider.credentialFromResult(result);
    const githubAccessToken = credential?.accessToken;
    
    // Store GitHub token for API access
    if (githubAccessToken) {
      localStorage.setItem('github_access_token', githubAccessToken);
      console.log('GitHub access token stored');
    }
    
    // Get GitHub username from the credential
    const githubUsername = (result.user as any).reloadUserInfo?.screenName || 
                           result.user.displayName?.toLowerCase() || 
                           '';
    
    console.log('GitHub Login Success:', {
      username: githubUsername,
      displayName: result.user.displayName,
      email: result.user.email,
      hasToken: !!githubAccessToken
    });
    
    return result;
  }

  logout(): Promise<void> {
    return signOut(this.auth).then(() => {
      // Clear Firebase local storage after signout
      const persistenceKey = 'firebase:authUser:' + firebaseConfig.apiKey + ':[DEFAULT]';
      localStorage.removeItem(persistenceKey);
    });
  }

  async revokeAllSessions(): Promise<void> {
    // Clear all Firebase auth data from storage
    const persistenceKeys = Object.keys(localStorage).filter(key => 
      key.includes('firebase') || key.includes(firebaseConfig.apiKey)
    );
    
    persistenceKeys.forEach(key => {
      localStorage.removeItem(key);
    });
    
    // Clear session storage
    sessionStorage.clear();
    
    // Clear IndexedDB (where Firebase stores auth data)
    if (window.indexedDB) {
      const dbDeleteRequest = indexedDB.deleteDatabase('firebaseLocalStorageDb');
      dbDeleteRequest.onsuccess = () => {
        console.log('Firebase IndexedDB cleared');
      };
    }
    
    // Sign out from Firebase
    await signOut(this.auth);
    
    // Force reload to clear any in-memory state
    setTimeout(() => {
      window.location.href = '/';
    }, 100);
    
    console.log('All sessions revoked and local auth data cleared');
  }

  getCurrentUser(): Observable<any> {
    return this.currentUser$;
  }

  isAuthenticated(): boolean {
    return !!this.currentUserSubject.value;
  }
}
