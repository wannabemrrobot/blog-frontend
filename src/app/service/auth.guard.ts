import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { map, take, filter } from 'rxjs/operators';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> {
    return this.authService.currentUser$.pipe(
      filter(user => user !== undefined), // Wait until auth state is determined (not initial undefined)
      take(1),
      map(user => {
        // If user is authenticated but not wannabemrrobot, redirect to home
        if (user && user.login && user.login !== 'wannabemrrobot') {
          console.log('AuthGuard: Access denied for user:', user.login);
          this.router.navigate(['/']);
          return false;
        }

        // Allow access for: no user (to show login) or authorized user
        console.log('AuthGuard: Access allowed, user:', user?.login || 'none');
        return true;
      })
    );
  }
}
