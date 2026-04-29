import { Injectable } from '@angular/core';
import Swal from 'sweetalert2';

@Injectable({
  providedIn: 'root'
})
export class SweetAlertService {

  constructor() { }

 success(message: string): Promise<any> {
  return Swal.fire({
    title: 'Success',
    html: `<div>${message}</div>`,
    icon: 'success',
    showConfirmButton: true,
    confirmButtonText: 'OK, Great!',
    background: 'rgba(255, 255, 255, 0.9)',
    color: '#2c3e50',
    width: '420px',
    buttonsStyling: false,
    customClass: {
      popup: 'glassy-info-popup',
      title: 'glassy-info-title',
      htmlContainer: 'glassy-info-body',
      confirmButton: 'glassy-info-btn',
      icon: 'glassy-info-icon'
    }
  });
}

  delete(message:string, onConfirm: () => void){
    Swal.fire({
    title: message,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Yes, delete it!',
    cancelButtonText: 'Cancel',
    confirmButtonColor: '#171829',
    cancelButtonColor: '#aaa',
    customClass: {
      container: 'notification-popup'
    }
  }).then((result) => {
    if (result.isConfirmed) {
      onConfirm(); // 🔥 call the actual delete function
    }
  });
  }

   cancel(message:string, onConfirm: () => void){
    Swal.fire({
    title: message,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Yes, cancel!',
    cancelButtonText: 'No',
    confirmButtonColor: '#171829',
    cancelButtonColor: '#aaa',
    customClass: {
      container: 'notification-popup'
    }
  }).then((result) => {
    if (result.isConfirmed) {
      onConfirm(); // 🔥 call the actual delete function
    }
  });
  }

  error(message:any){
    Swal.fire({
      icon: "error",
      text:`<div>${message}</div>`,
      background: 'rgba(255, 255, 255, 0.9)',
      color: '#2c3e50',
      width: '420px',
      buttonsStyling: false,
    });
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: message,
      showCancelButton: false,
      showConfirmButton: true,
      confirmButtonText: "Ok",
      confirmButtonColor: '#171829',
    background: 'rgba(255, 255, 255, 0.9)',
    color: '#2c3e50',
    width: '420px',
      customClass: {
      popup: 'glassy-info-popup',
      title: 'glassy-info-title',
      htmlContainer: 'glassy-info-body',
      confirmButton: 'glassy-info-btn',
      icon: 'glassy-info-icon'
    }
    });
  }

info(message: string, onConfirm?: () => void): void {
  Swal.fire({
    title: 'Information',
    html: `<div>${message}</div>`,
    icon: 'info',
    showConfirmButton: true,
    confirmButtonText: 'OK, Got It!',
    background: 'rgba(255, 255, 255, 0.9)',
    color: '#2c3e50',
    width: '420px',
    buttonsStyling: false,
    customClass: {
      popup: 'glassy-info-popup',
      title: 'glassy-info-title',
      htmlContainer: 'glassy-info-body',
      confirmButton: 'glassy-info-btn',
      icon: 'glassy-info-icon'
    }
  }).then((result) => {
    if ((result.isConfirmed || result.dismiss) && onConfirm) {
      onConfirm();
    }
     if (result.isDismissed && onConfirm) {
      onConfirm();
    }
  });
}

warning(message: string): void {
  Swal.fire({
    title: 'Warning',
    html: `<div>${message}</div>`,
    icon: 'warning',
    showConfirmButton: true,
    confirmButtonText: 'OK, Got It!',
    background: 'rgba(255, 255, 255, 0.9)',
    color: '#2c3e50',
    width: '420px',
    buttonsStyling: false,
    customClass: {
      popup: 'glassy-info-popup',
      title: 'glassy-info-title',
      htmlContainer: 'glassy-info-body',
      confirmButton: 'glassy-info-btn',
      icon: 'glassy-info-icon'
    }
  })
}

confirm(message: string, options?: any) {
  return Swal.fire({
    title: message,
    icon: 'warning',
    showCancelButton: true,
     allowOutsideClick: false,   // ⛔ block outside click
    allowEscapeKey: false, 
    confirmButtonText: options?.confirmButtonText || 'Yes',
    cancelButtonText: options?.cancelButtonText || 'No',
    background: 'rgba(255, 255, 255, 0.9)',
    color: '#2c3e50',
    width: '420px',
    buttonsStyling: false,
    customClass: {
      popup: 'glassy-info-popup',
      title: 'glassy-info-title',
      htmlContainer: 'glassy-info-body',
      confirmButton: 'glassy-info-btn',
      cancelButton: 'glassy-info-btn',
      icon: 'glassy-info-icon',
      actions: 'glassy-info-actions'  // custom class for buttons container
    }
  });
}


}
