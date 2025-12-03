import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms'
import { Router } from '@angular/router'
import { HttpClient } from '@angular/common/http';
import { setThrowInvalidWriteToSignalError } from '@angular/core/primitives/signals';
import { environment } from '../../environments/environment';



@Component({
  selector: 'app-login-registro',
  standalone: false,
  templateUrl: './login-registro.component.html',
  styleUrl: './login-registro.component.css'
})
export class LoginRegistroComponent {
  loginForm: FormGroup;
  registerForm: FormGroup;
  errorMessage: string = '';
  registerMessage: string = '';
  showRegisterForm: boolean = false;
  private apiUrl = environment.apiUrl;
  

  //TOGGLE PASSWORD
  showPassword: boolean = false;
  showPasswordReg: boolean = false;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private http: HttpClient,
  ){
    this.loginForm = this.fb.group({
      username: ['', Validators.required],
      password: ['',Validators.required],
    });
    this.registerForm = this.fb.group({
      username: ['',Validators.required],
      password: ['',Validators.required],
      email: ['',Validators.required],
      first_name: [''],
      last_name: [''],
    });
  }

  login(): void {
    if (this.loginForm.invalid) return;

    const { username, password } = this.loginForm.value;
    this.errorMessage = '';

    this.http.post(`${this.apiUrl}/login/`,{
      username,password
    }).subscribe({
      next: (res: any) => {
        console.log("Respuesta de Django:" ,res.user_id.toString())
        localStorage.setItem('usuario', res.user_id.toString());
        //alert('Login exitoso');
        this.router.navigate(['/home']);
      },
      error: () => this.errorMessage = 
        'Usuario o contraseña incorrectos'
    });
  }

  logout (){
    localStorage.removeItem('usuario');
    alert('Sesion cerrada');
  }

  estaLogueado(): boolean{
    return localStorage.getItem('usuario') !==null;
  }

  cambiarRegistro(): void{
    this.showRegisterForm = !this.showRegisterForm;
    this.registerMessage = '';
    this.errorMessage = '';
  }

  enRegistro(): void {
    const{
      username, password,first_name,
      last_name,email
    } = this.registerForm.value;
    this.http.post(`${this.apiUrl}/register/`,{
      username,password,first_name,last_name,email
    }).subscribe({
      next:() =>{
        this.showRegisterForm = false;
        //this.router.navigate(['/dashboard'])
      },
      error: err => alert ('Error:' + err.error.error)
    });
  }
}
