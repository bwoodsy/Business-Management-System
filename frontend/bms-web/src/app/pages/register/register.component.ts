import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './register.html',
  styleUrls: ['./register.css']
})
export class RegisterComponent {
  username = '';
  password = '';

  constructor(public auth: AuthService, private router: Router) {}

  onSubmit() {
    this.auth.register(this.username, this.password).subscribe((res) => {
      if (this.auth.isAuthenticated()) {
        this.router.navigate(['/']);
      }
    });
  }
}
