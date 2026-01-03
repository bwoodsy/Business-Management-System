import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-shell',
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './shell.html',
  styleUrls: ['./shell.css'],
})
export class Shell {
  constructor(public auth: AuthService) {}

  logout() {
    this.auth.logout();
  }
}
