import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

@Component({
  selector: 'app-login',
  imports: [CommonModule],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login {
  showPassword: boolean = false;

  togglePassword() {
    this.showPassword = !this.showPassword;
  }
  
 login() {
    // this.commonService.updateLoader(true);
    //     this.loading = true;
    // this.identityService.login(this.loginFormGroup.getRawValue()).subscribe({
    //   next: (response) => {
    //     if (response && response.data && response.data.token) {
    //       console.log(response && response.data)
    //       this.toasterService.success('Login Successfully.');
    //       this.identityService.setToken(response.data.token);
    //       this.identityService.setBranchCode(response.data.branchCode);
    //       this.identityService.setLocation(response.data.multiLocation);
    //       this.identityService.setBranchName(response.data.branchName);
    //       this.identityService.setDesignation(response.data.designation);
    //       this.identityService.setRegion(response.data.reportLocName);
    //       this.identityService.setUserName(response.data.name);
    //       this.identityService.setRegionCode(response.data.reportingLoc);
    //       localStorage.setItem('loginUser', JSON.stringify(response.data));

    //       this.commonService.getMenu().subscribe((res)=>{
    //         localStorage.setItem('ISSFMMASTER', JSON.stringify(res.data[0]));
    //         this.router.navigateByUrl('/welcome');
    //         this.identityService.setUserType()
    //       }); 

    //          this.loading = false; // hide button loader
    //               setTimeout(() => {
    //           this.refreshToken();
    //         }, 3000);
          
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
}
