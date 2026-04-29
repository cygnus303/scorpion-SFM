import { Component, OnInit, PLATFORM_ID, Inject } from '@angular/core';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { ToastrService, ToastrModule } from 'ngx-toastr';
import { NgxSpinnerModule } from 'ngx-spinner';
import { AuthService } from '../../../shared/services/auth.service';
import { CommonService } from '../../../shared/services/common.service';
import { IdentityService } from '../../../shared/services/identity.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ToastrModule, NgxSpinnerModule],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login implements OnInit {
  public loginFormGroup!: FormGroup;
  public isFormSubmit = false;
  isPasswordVisible: boolean = false;
  password: string = '';
  public loading: boolean = false;

  constructor(
    private identityService: IdentityService,
    private commonService: CommonService,
    private authService: AuthService,
    private toasterService: ToastrService,
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object
  ) { }

  showPassword: boolean = false;

  togglePassword() {
    this.showPassword = !this.showPassword;
  }

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      const urlParams = new URLSearchParams(window.location.search);
      const token = urlParams.get('token');
      if (token) {
        this.validateToken(token!);
      }
    }
    this.buildLoginForm();
  }

  buildLoginForm(): void {
    this.loginFormGroup = new FormGroup({
      password: new FormControl(null, [
        Validators.required,
      ]),
      username: new FormControl(null, [Validators.required]),
    });
  }

  validateToken(token: string) {
    this.commonService.updateLoader(true);
    this.authService.validateToken({ token: token }).subscribe({
      next: (response: any) => {
        if (response.success) {
          if (response.data.isValid) {
            this.identityService.setToken(token);
            this.router.navigateByUrl('/dashboard');
          } else {
            this.router.navigateByUrl('/login');
          }
        } else {
          this.toasterService.error(response.error.message);
        }
        this.commonService.updateLoader(false);
      },
      error: (response: any) => {
        this.toasterService.error(response);
        this.commonService.updateLoader(false);
      },
    });
  }

  togglePasswordVisibility() {
    this.isPasswordVisible = !this.isPasswordVisible;
  }

  get loginControls(): { [key: string]: AbstractControl } {
    let loginDetail = this.loginFormGroup.controls;
    return loginDetail;
  }

  public onSubmitLogin(): void {
    if (this.loginFormGroup.invalid) {
      return;
    }
    this.login();
  }

  login() {
    this.router.navigateByUrl('/dashboard');
    // this.commonService.updateLoader(true);
    // this.loading = true;
    // this.identityService.login(this.loginFormGroup.getRawValue()).subscribe({
    //   next: (response) => {
    //     if (response && response.data && response.data.token) {
    //       console.log(response && response.data)
    //       this.toasterService.success('Login Successfully.');
    //       this.identityService.setToken(response.data.token);
    //       localStorage.setItem('loginUser', JSON.stringify(response.data));
    //       this.loading = false;
    //       setTimeout(() => {
    //         this.refreshToken();
    //       }, 3000);

    //     } else {
    //       this.toasterService.error(response.errorMessage);
    //       this.commonService.updateLoader(false);
    //     }
    //   },
    //   error: (response: any) => {
    //     this.loading = false;
    //     this.commonService.updateLoader(false);
    //     this.toasterService.error(response.error.message);
    //   },
    // });
  }

  refreshToken() {
    this.identityService.generateRefreshToken().subscribe({
      next: (response) => {
        if (response && response.data && response.data.refreshToken) {
          this.identityService.setRefreshToken(response.data.refreshToken);
        }
      },
      error: (response: any) => {
        // this.toasterService.error(response);
      },
    });
  }

  public onShowLogin(): void {
    this.buildLoginForm();
    this.isFormSubmit = false;
  }
}
