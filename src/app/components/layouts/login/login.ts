import { Component, OnInit, OnDestroy, PLATFORM_ID, Inject } from '@angular/core';
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
import { SweetAlertService } from '../../../shared/services/sweet-alert.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ToastrModule, NgxSpinnerModule],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login implements OnInit, OnDestroy {
  public backgroundImages: string[] = [
    'assets/images/img-lead.jpg',
    'assets/images/login-bg.png', // Logistics warehouse
    'assets/images/bg-img.png', // Delivery trucks
    'https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=2670&auto=format&fit=crop' // Awesome Analytics UI / Technology interface
  ];
  public currentBgIndex: number = 0;
  public animationsReady: boolean = false;
  private bgInterval: any;

  public loginForm!: FormGroup;
  public isFormSubmit = false;
  isPasswordVisible: boolean = false;
  password: string = '';
  public loading: boolean = false;

  constructor(
    private identityService: IdentityService,
    private commonService: CommonService,
    private authService: AuthService,
    private toasterService: ToastrService,
    private sweetAlertService: SweetAlertService,
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object
  ) { }

  showPassword: boolean = false;

  togglePassword() {
    this.showPassword = !this.showPassword;
  }

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.startBackgroundAnimation();
      const urlParams = new URLSearchParams(window.location.search);
      const token = urlParams.get('token');
      if (token) {
        this.validateToken(token!);
      }
    }
    this.buildLoginForm();
  }

  ngOnDestroy(): void {
    if (this.bgInterval) {
      clearInterval(this.bgInterval);
    }
  }

  startBackgroundAnimation() {
    setTimeout(() => {
      this.animationsReady = true;
    }, 500);

    this.bgInterval = setInterval(() => {
      this.currentBgIndex = (this.currentBgIndex + 1) % this.backgroundImages.length;
    }, 2000);
  }

  buildLoginForm(): void {
    this.loginForm = new FormGroup({
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
            this.commonService.updateUserId(); // Update user ID after token validation
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
    let loginDetail = this.loginForm.controls;
    return loginDetail;
  }


  login() {
    if (this.loginForm.invalid) {
      return;
    }
    // this.commonService.updateLoader(true);
    this.loading = true;
    this.identityService.login(this.loginForm.value).subscribe({
      next: (response) => {
        if (response && response.data && response.data.token) {
          this.identityService.setToken(response.data.token);
          this.identityService.setBranchCode(response.data.branchCode);
          this.identityService.setLocation(response.data.multiLocation);
          this.identityService.setBranchName(response.data.branchName);
          this.identityService.setDesignation(response.data.designation);
          this.identityService.setRegion(response.data.reportLocName);
          this.identityService.setUserName(response.data.name);
          this.identityService.setRegionCode(response.data.reportingLoc);
          localStorage.setItem('loginUser', JSON.stringify(response.data));
          this.commonService.updateUserId(); // Update user ID after login
          this.toasterService.success('Login Successfully.');
          this.commonService.getMenu().subscribe((res) => {
            localStorage.setItem('ISSFMMASTER', JSON.stringify(res.data[0]));
            this.router.navigateByUrl('/dashboard');
            this.identityService.setUserType()
          });
          this.loading = false;
          setTimeout(() => {
            this.refreshToken();
          }, 1000);

        } else {
          this.sweetAlertService.error(response.errorMessage);
          this.loading = false;
        }
      },
      error: (response: any) => {
        this.loading = false;
        this.sweetAlertService.error(response.error.message);
      },
    });
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
