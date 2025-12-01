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
        
        // Try to get GitHub username from reloadUserInfo
        githubUsername = (user as any).reloadUserInfo?.screenName || '';
        
        // If we have a stored GitHub access token, fetch the actual username from GitHub API
        const githubAccessToken = localStorage.getItem('github_access_token');
        if (githubAccessToken && !githubUsername) {
          try {
            const response = await fetch('https://api.github.com/user', {
              headers: {
                'Authorization': `Bearer ${githubAccessToken}`,
                'Accept': 'application/vnd.github.v3+json'
              }
            });
            
            if (response.ok) {
              const githubData = await response.json();
              githubUsername = githubData.login; // This is the immutable GitHub username
              console.log('Fetched GitHub username from API:', githubUsername);
            }
          } catch (error) {
            console.error('Error fetching GitHub username:', error);
          }
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
    
    try {
      const result = await signInWithPopup(this.auth, provider);
      
      // Get GitHub access token
      const credential = GithubAuthProvider.credentialFromResult(result);
      const githubAccessToken = credential?.accessToken;
      
      // Store GitHub token for API access
      if (githubAccessToken) {
        localStorage.setItem('github_access_token', githubAccessToken);
        console.log('GitHub access token stored');
        
        // Fetch actual GitHub username using the access token
        try {
          const response = await fetch('https://api.github.com/user', {
            headers: {
              'Authorization': `Bearer ${githubAccessToken}`,
              'Accept': 'application/vnd.github.v3+json'
            }
          });
          
          if (response.ok) {
            const githubData = await response.json();
            const actualGithubUsername = githubData.login; // This is the immutable GitHub username
            console.log('GitHub Login Success:', {
              username: actualGithubUsername,
              displayName: result.user.displayName,
              email: result.user.email,
              hasToken: !!githubAccessToken
            });
          }
        } catch (error) {
          console.error('Error fetching GitHub username:', error);
        }
      }
      
      return result;
    } catch (error: any) {
      console.error('Sign in error:', error);
      // If popup was closed or blocked, throw a cleaner error
      if (error.code === 'auth/popup-closed-by-user') {
        throw new Error('Sign in popup was closed. Please try again.');
      }
      throw error;
    }
  }

  async logout(): Promise<void> {
    // Sign out from Firebase
    await signOut(this.auth);
    
    // Clear GitHub token
    localStorage.removeItem('github_access_token');
    
    // Clear all Firebase auth data from storage
    const persistenceKeys = Object.keys(localStorage).filter(key => 
      key.includes('firebase') || key.includes(firebaseConfig.apiKey)
    );
    
    persistenceKeys.forEach(key => {
      localStorage.removeItem(key);
    });
    
    // Clear session storage
    sessionStorage.clear();
    
    console.log('User logged out and session data cleared');
  }

  getCurrentUser(): Observable<any> {
    return this.currentUser$;
  }

  isAuthenticated(): boolean {
    return !!this.currentUserSubject.value;
  }
}
