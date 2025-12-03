import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { ChartConfiguration, ChartType, ChartData, ChartOptions } from 'chart.js';
import { InversionesService } from '../services/inversiones.service';
import { environment } from '../../environments/environment';


interface Activo{
  simbolo: string;
  participaciones: number;
  precio_medio: number;
  precio_actual: number;
  alertas: number;
  total_invertido: number;
  tipo_activo?: string;
}



@Component({
  selector: 'app-home',
  standalone: false,
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent implements OnInit{
  activos: Activo[] = [];
  precio: number = 0;
  private apiUrl = environment.apiUrl;

  constructor(
    private http: HttpClient,
    private router: Router,
    private inversionesService: InversionesService
  ){}

  ngOnInit(): void {
    const userId = Number(localStorage.getItem('usuario'));
    
    this.http.get<Activo[]>(`${this.apiUrl}activos/${userId}/`) 
    .subscribe({
      next:(data:any) =>{
        this.activos = data;
        this.actualizarGraficoPie(this.activos);
        this.actualizarGraficoLineas();
        this.actualizarGraficoBarras(this.activos);
        this.actualizarGraficoPieTipos(this.activos);
        this.actualizarGraficoBarrasPorcentaje(this.activos);
      },
      error: (err) =>{
        console.error('Error al obtener activos: ',err);
      }
    });
  }

  logout (){
    localStorage.removeItem('usuario');
    this.router.navigate(['/login']);
  }

  obtenerPrecioAPI():void{
    const simbolo = this.nuevoActivo.simbolo;
    if (!simbolo){
      alert('Primero debes introducir el símbolo del activo.');
      return;
    }

    this.http.get<any>(`${this.apiUrl}/precio/?simbolo=${simbolo}`).subscribe({
      next:res =>{
        this.nuevoActivo.precio_compra = parseFloat(res.precio.toFixed(2));
        this.calcularInversionTotal();
      },
      error:(err) =>{
        console.error('Error al obtener el precio actual: ',err);
        alert('No se pudo obtener el precio actual del activo.');
      }
    })
  }

  get activosFiltrados() {
    return this.activos.filter(a => a.participaciones >0);
  }

  calcularPorcentaje(activo:Activo): number{
    const variacion = ((activo.precio_actual - activo.precio_medio) / activo.precio_medio)*100;
    return variacion
  }

  calcularValorActual(activo: Activo): number {
    const porcentaje = this.calcularPorcentaje(activo);
    return activo.total_invertido + (activo.total_invertido * (porcentaje / 100));
  }


  //Métodos para crear un activo:

  mostrarFormulario: boolean = false;

  cerrarFormulario() {
    this.mostrarFormulario = false;
    // NUEVO: Limpiar el formulario al cerrar para evitar datos residuales
    this.nuevoActivo = {
      usuario: parseInt(localStorage.getItem('usuario') || '0', 10),
      simbolo: '',
      nombre: '',
      cantidad: 0,
      tipo_activo: '',
      tipo_transaccion: '',
      precio_compra: 0,
      fecha_transaccion: ''
    };
  }

  cerrarHistorico(): void {
    this.mostrarHistorico = false;
    this.simboloSeleccionado= '';
  }

  // MODIFICADO: El comentario ahora indica que 'cantidad' son PARTICIPACIONES
  nuevoActivo = {
    usuario: parseInt(localStorage.getItem('usuario') || '0', 10),
    simbolo: '',
    nombre: '',
    cantidad: 0,  // AHORA REPRESENTA PARTICIPACIONES/TÍTULOS (no dinero)
    tipo_activo: '',
    tipo_transaccion: '',
    precio_compra: 0,
    fecha_transaccion: ''
  };

  // NUEVO MÉTODO: Se dispara automáticamente cuando cambian cantidad o precio
  // en el HTML mediante (ngModelChange)="calcularInversionTotal()"
  calcularInversionTotal(): void {
    // Este método está vacío porque solo sirve para que Angular
    // detecte el cambio y actualice la vista.
    // El cálculo real se hace en calcularTotalInvertir()
  }

  // NUEVO MÉTODO: Calcula el total a invertir (participaciones × precio)
  // Se usa en el template para mostrar el resultado en tiempo real
  calcularTotalInvertir(): number {
    if (this.nuevoActivo.cantidad && this.nuevoActivo.precio_compra) {
      return this.nuevoActivo.cantidad * this.nuevoActivo.precio_compra;
    }
    return 0;
  }

  irAgregarTransaccion(): void{
    this.mostrarFormulario = true;
  }

  // MODIFICADO: Agregadas validaciones y mensaje de confirmación mejorado
  agregarActivo (): void {
    // NUEVAS VALIDACIONES antes de enviar
    if (!this.nuevoActivo.simbolo || !this.nuevoActivo.nombre) {
      alert('Por favor, completa el símbolo y nombre del activo.');
      return;
    }

    if (this.nuevoActivo.cantidad <= 0) {
      alert('La cantidad de participaciones debe ser mayor a 0.');
      return;
    }

    if (this.nuevoActivo.precio_compra <= 0) {
      alert('El precio de compra debe ser mayor a 0.');
      return;
    }

    //Redondear el precio de compar a 2 decimales antes de enviar al back:
    const precioRedondeado = parseFloat(this.nuevoActivo.precio_compra.toFixed(2))
    const cantidadRedondeada = parseFloat(this.nuevoActivo.cantidad.toFixed(2))

    const payload = {
      usuario : localStorage.getItem('usuario'),
      simbolo : this.nuevoActivo.simbolo,
      nombre: this.nuevoActivo.nombre,
      cantidad : cantidadRedondeada, //Enviamos ya numero redondeado.
      tipo_activo : this.nuevoActivo.tipo_activo,
      tipo_transaccion : this.nuevoActivo.tipo_transaccion,
      precio_compra: precioRedondeado, //Enviamos ya el numero redondeado.
      fecha_transaccion : this.nuevoActivo.fecha_transaccion,
    };

    this.http.post(`${this.apiUrl}activos/add/`,payload).subscribe({
      next: (res) => {
        // NUEVO: Mensaje mejorado que muestra participaciones y total
        const totalInvertir = this.calcularTotalInvertir();
        alert(`Transacción añadida exitosamente.\n\nParticipaciones: ${this.nuevoActivo.cantidad}\nTotal invertido: ${totalInvertir.toFixed(2)}€`);
        this.cerrarFormulario();
        window.location.reload();
      },
      error: err => {
        // NUEVO: Manejo de errores mejorado
        console.error('Error:', err);
        alert('Error al añadir la transacción: ' + (err.error?.detail || 'Error desconocido'));
      }
    })
  }


  // Funcionalidad para ver la cuenta personal del usuario:
  mostrarCuenta: boolean = false;
  perfilUsuario: any = {}

  verCuenta() {
    this.mostrarCuenta = true;
    const userId = parseInt(localStorage.getItem('usuario') || '0', 10);
    this.http.get(`${this.apiUrl}perfil/${userId}`).subscribe({
      next: (res) => {
        this.perfilUsuario = res;
      },
      error:() => {
        alert("No se pudo cargar el perfil del usuario");
      }
    });
  }

  cerrarCuenta(){
    this.mostrarCuenta = false;
  }

  // Funcionalidad para ver los graficos del usuario:
  mostrarGraficos: boolean = false;
  verGraficos() { 
    this.mostrarGraficos = true;
    const userId = parseInt(localStorage.getItem('usuario') || '0', 10);
    this.http.get(`${this.apiUrl}perfil/${userId}`).subscribe({
      next:(res) => {
        this.perfilUsuario = res;
      },
      error:()=>{
        alert("No se pudo cargar el perfil del ususario.");
      }
    });
  }

  cerrarGraficos() {
    this.mostrarGraficos = false;
  }



  completarNombreConSimbolo() : void{
    const simbolo = this.nuevoActivo.simbolo;

    if(simbolo.trim().length < 2) return;

    this.http.get<any>(`${this.apiUrl}buscar-activo/?activo=${encodeURIComponent(simbolo)}`)
    .subscribe({
      next: res => {
        this.nuevoActivo.nombre = res.nombre;
      },
      error: () => {
        console.log('No se encontró el nombre.');
      }
    })
  }

  completarSimboloConNombre() : void{
    const nombre = this.nuevoActivo.nombre;

    if(nombre.trim().length < 2) return;

    this.http.get<any>(`${this.apiUrl}/buscar-activo/${nombre}`)
    .subscribe({
      next: res => {
        this.nuevoActivo.simbolo = res.simbolo;
        console.log(res)
      },
      error: () => {
        console.log('No se encontró el nombre.');
      }
    })
  }

  /////////////////////////////
//  GRAFICO DE BARRAS PORCENTAJE:
////////////////////////////

tipoGraficoBarrasPorcentaje: 'bar' = 'bar';
CamposGraficoBarrasPorcentaje: string[] = [];
DatosGraficoBarrasPorcentaje: number[] = [];

dataGraficoBarrasPorcentaje: ChartConfiguration<'bar'>['data'] = {
  labels: [],
  datasets: [{
    label: 'Rendimiento (%)',
    data: [],
    backgroundColor: [],
    borderWidth: 2
  }]
};

OpcionesGraficoBarrasPorcentaje: ChartConfiguration<'bar'>['options'] = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: false
    },
    title: {
      display: true,
      text: 'Rendimiento Porcentual por Activo',
      color: '#fff126',
      font: { size: 18, weight: 'bold' },
      padding: { bottom: 20 }
    },
    tooltip: {
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      titleColor: '#fff126',
      bodyColor: 'white',
      borderColor: '#fff126',
      borderWidth: 1,
      padding: 12,
      callbacks: {
        label: function(context: any) {
          const value = context.parsed.y;
          const signo = value >= 0 ? '+' : '';
          return signo + value.toFixed(2) + '%';
        }
      }
    }
  },
  scales: {
    y: {
      ticks: { 
        color: 'white',
        font: { size: 12 },
        callback: function(value: any) {
          return value + '%';
        }
      },
      grid: { 
        color: 'rgba(255, 255, 255, 0.1)'
      },
      border: {
        display: false
      }
    },
    x: {
      ticks: { 
        color: 'white',
        font: { size: 13, weight: 'bold' }
      },
      grid: { 
        display: false
      },
      border: {
        display: false
      }
    }
  }
};



    ////////////////////////////
  // GRAFICO PIE: 
  ///////////////////////////

    //lista de etiquetas del gráfico:
    CamposGraficoPie: string[] = [];
    //lista de datos de cada etiqueta:
    DatosGraficoPie: number[] = [];

    // tipo de gráfico: circular:
    tipoGraficoPie: 'pie' = 'pie';

    //Creamos el objeto de Chart.js
    dataGraficoPie: ChartConfiguration<'pie'>['data'] = {
    labels: [],
    datasets: [{ data: [] }]
  };

    //Opciones visuales del grafico:
  OpcionesGraficoPie: ChartConfiguration<'pie'>['options'] = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: { 
      legend: {
        position: 'bottom',
        labels: {
          color: 'white',
          font: { size: 11 },
          padding: 8,
          boxWidth: 15
        }
      }
    }
  };

    //Funcion para el grafico circular:
    actualizarGraficoPie(activos: any[]) {
      const total = activos.reduce((acc,a) => acc + a.total_invertido,0);
      this.CamposGraficoPie = activos.map (a => a.simbolo);

      this.DatosGraficoPie = activos.map(a => 
        +(100 * a.total_invertido / total).toFixed(2)
      ,'%');
      this.dataGraficoPie = {
      labels: this.CamposGraficoPie,
      datasets: [{
        data: this.DatosGraficoPie,
        backgroundColor: ['#ff6384', '#36a2eb', '#ffcd56', '#4bc0c0', '#9966ff', '#ff9f40'],
        borderWidth: 1
      }]
    };

    }

  /////////////////////////////
  //  GRAFICO DE LINEAS:
  ////////////////////////////

  tipoGraficoLineas: 'line' = 'line';

  CamposGraficoLineas: string[] = [];
  DatosGraficoLineas: number[] = [];

  dataGraficoLineas: ChartConfiguration<'line'>['data'] = {
    labels: [],
    datasets: [
      { 
        label: 'Invertido',
        data: [],
        borderColor: '#36a2eb',
        backgroundColor: 'rgba(54,162,235,0.2)',
      },
      {
        label: 'Precio actual',
        data: [],
        borderColor: '#ff6384',
        backgroundColor: 'rgba(255,99,132,0.2)',
        fill: true
      }
    ]
  };

OpcionesGraficoLineas: ChartConfiguration<'line'>['options'] = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'top',
      labels: { 
        color: 'white',
        font: { size: 14, weight: 'bold' },
        padding: 15,
        usePointStyle: true
      }
    },
    title: {
      display: true,
      text: 'Evolución de tu Cartera',
      color: '#fff126',
      font: { size: 18, weight: 'bold' },
      padding: { bottom: 20 }
    },
    tooltip: {
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      titleColor: '#fff126',
      bodyColor: 'white',
      borderColor: '#fff126',
      borderWidth: 1,
      padding: 12,
      displayColors: true,
      callbacks: {
        label: function(context: any) {
          let label = context.dataset.label || '';
          if (label) {
            label += ': ';
          }
          // Cambio aquí: usar context.parsed.y con type any
          const value = context.parsed?.y ?? 0;
          label += new Intl.NumberFormat('es-ES', { 
            style: 'currency', 
            currency: 'EUR' 
          }).format(value);
          return label;
        }
      }
    }
  },
  scales: {
    y: {
      beginAtZero: true,
      ticks: { 
        color: 'white',
        font: { size: 12 },
        callback: function(value: any) {
          return new Intl.NumberFormat('es-ES', { 
            style: 'currency', 
            currency: 'EUR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
          }).format(value);
        }
      },
      grid: { 
        color: 'rgba(255, 255, 255, 0.1)'
      },
      border: {
        display: false
      }
    },
    x: {
      ticks: { 
        color: 'white',
        font: { size: 11 },
        maxRotation: 45,
        minRotation: 45
      },
      grid: { 
        color: 'rgba(255, 255, 255, 0.05)'
      },
      border: {
        display: false
      }
    }
  },
  interaction: {
    mode: 'index',
    intersect: false
  }
};

  

 actualizarGraficoLineas(): void {
  const userId = Number(localStorage.getItem('usuario'));
  
  this.http.get(`${this.apiUrl}inversiones-timeseries/${userId}/`)
    .subscribe({
      next: (data: any) => {
        console.log('Datos recibidos del time series:', data);
        
        if (!data || data.length === 0) {
          console.log('No hay datos de series temporales');
          return;
        }
        
        // Extraer fechas, inversión y valor actual
        const fechas = data.map((d: any) => {
          const fecha = new Date(d.fecha);
          return fecha.toLocaleDateString('es-ES', { 
            day: '2-digit', 
            month: 'short' 
          });
        });
        
        const invertido = data.map((d: any) => d.invertido);
        const valorActual = data.map((d: any) => d.valor_actual);
        
        console.log('Fechas:', fechas);
        console.log('Invertido:', invertido);
        console.log('Valor Actual:', valorActual);
        
        // Actualizar el gráfico con estilo mejorado
        this.dataGraficoLineas = {
          labels: fechas,
          datasets: [
            {
              label: 'Total Invertido',
              data: invertido,
              borderColor: '#36a2eb',
              backgroundColor: 'rgba(54, 162, 235, 0.1)',
              fill: true,
              tension: 0.4,
              borderWidth: 3,
              pointRadius: 4,
              pointHoverRadius: 6,
              pointBackgroundColor: '#36a2eb',
              pointBorderColor: '#fff',
              pointBorderWidth: 2
            },
            {
              label: 'Valor Actual (Retorno)',
              data: valorActual,
              borderColor: '#fff126',
              backgroundColor: 'rgba(255, 241, 38, 0.15)',
              fill: true,
              tension: 0.4,
              borderWidth: 3,
              pointRadius: 4,
              pointHoverRadius: 6,
              pointBackgroundColor: '#fff126',
              pointBorderColor: '#fff',
              pointBorderWidth: 2
            }
          ]
        };
      },
      error: (err) => {
        console.error('Error al obtener series temporales:', err);
      }
    });
}




  /////////////////////////////
  //  GRAFICO DE BARRAS:
  ////////////////////////////

  tipoGraficoBarras: 'bar' = 'bar';

  CamposGraficoBarras: string[] = [];
  DatosGraficoBarras: number[] = [];

  dataGraficoBarras: ChartConfiguration<'bar'>['data'] = {
    labels: [],
    datasets: [
      {
        label: 'Inversion',
        data: [],
        backgroundColor: '#36a2eb',
        borderWidth: 1
      },
      {
        label: 'Precio Actual',
        data: [],
        borderColor: '#ff6384',
        backgroundColor: 'rgba(255,99,132,0.2)'
      }
    ]
  };

  OpcionesGraficoBarras: ChartConfiguration<'bar'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: 'y', // Horizontal
    plugins: {
      legend: {
        display: false
      },
      title: {
        display: true,
        text: 'Rendimiento por Activo',
        color: '#fff126',
        font: { size: 18, weight: 'bold' },
        padding: { bottom: 20 }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#fff126',
        bodyColor: 'white',
        borderColor: '#fff126',
        borderWidth: 1,
        padding: 12,
        callbacks: {
          label: function(context: any) {
            const value = context.parsed.x;
            const signo = value >= 0 ? '+' : '';
            return signo + new Intl.NumberFormat('es-ES', { 
              style: 'currency', 
              currency: 'EUR' 
            }).format(value);
          }
        }
      }
    },
    scales: {
      x: {
        ticks: { 
          color: 'white',
          font: { size: 12 },
          callback: function(value: any) {
            const signo = value >= 0 ? '+' : '';
            return signo + new Intl.NumberFormat('es-ES', { 
              style: 'currency', 
              currency: 'EUR',
              minimumFractionDigits: 0,
              maximumFractionDigits: 0
            }).format(value);
          }
        },
        grid: { 
          color: 'rgba(255, 255, 255, 0.1)'
        },
        border: {
          display: false
        }
      },
      y: {
        ticks: { 
          color: 'white',
          font: { size: 13, weight: 'bold' }
        },
        grid: { 
          display: false
        },
        border: {
          display: false
        }
      }
    }
  };



  ////////////////////////////
  // GRAFICO PIE TIPOS:
  ///////////////////////////
  tipoGraficoPieTipos: 'pie' = 'pie';
  CamposGraficoPieTipos: string[] = [];
  DatosGraficoPieTipos: number[] = [];

  dataGraficoPieTipos: ChartConfiguration<'pie'>['data'] = {
    labels: [],
    datasets: [{ data: [] }]
  };

  OpcionesGraficoPieTipos: ChartConfiguration<'pie'>['options'] = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: 'white',
          font: { size: 11 },
          padding: 8,
          boxWidth: 15
        }
      }
    }
  };

  // Función para agrupar por tipo de activo
  actualizarGraficoPieTipos(activos: any[]): void {
    // Agrupar por tipo_activo con tipo explícito
    const agrupados: { [key: string]: number } = activos.reduce((acc, activo) => {
      const tipo = activo.tipo_activo || 'Otros';
      if (!acc[tipo]) {
        acc[tipo] = 0;
      }
      acc[tipo] += parseFloat(activo.total_invertido) || 0;
      return acc;
    }, {} as { [key: string]: number });  // ← Tipo explícito aquí

    // Calcular total
    const total = Object.values(agrupados).reduce((sum, val) => sum + val, 0);

    // Si el total es 0, no actualizar el gráfico
    if (total === 0) {
      return;
    }

    // Preparar datos para el gráfico
    this.CamposGraficoPieTipos = Object.keys(agrupados);
    this.DatosGraficoPieTipos = Object.values(agrupados).map(val => 
      +(100 * val / total).toFixed(2)
    );

    this.dataGraficoPieTipos = {
      labels: this.CamposGraficoPieTipos,
      datasets: [{
        data: this.DatosGraficoPieTipos,
        backgroundColor: ['#4CAF50', '#FF9800', '#2196F3', '#9C27B0', '#F44336'],
        borderWidth: 2,
        borderColor: '#1f1f1f'
      }]
    };
  }

  actualizarGraficoBarras(activos: any[]) {
    const simbolos = activos.map(a => a.simbolo);
    
    // Calcular ganancia/pérdida para cada activo
    const gananciaPerdida = activos.map(a => {
      const valorActual = a.participaciones * a.precio_actual;
      const ganancia = valorActual - a.total_invertido;
      return parseFloat(ganancia.toFixed(2));
    });
    
    // Colores dinámicos: verde si gana, rojo si pierde
    const colores = gananciaPerdida.map(valor => 
      valor >= 0 ? '#4CAF50' : '#F44336'
    );
    
    this.dataGraficoBarras = {
      labels: simbolos,
      datasets: [{
        label: 'Ganancia/Pérdida (€)',
        data: gananciaPerdida,
        backgroundColor: colores,
        borderColor: colores.map(c => c === '#4CAF50' ? '#45a049' : '#d32f2f'),
        borderWidth: 2,
        borderRadius: 8,
        borderSkipped: false
      }]
    };
  }

    actualizarGraficoBarrasPorcentaje(activos: any[]): void {
    const simbolos = activos.map(a => a.simbolo);
    
    // Calcular porcentaje de rendimiento para cada activo
    const porcentajes = activos.map(a => {
      if (a.precio_medio === 0) return 0;
      const rendimiento = ((a.precio_actual - a.precio_medio) / a.precio_medio) * 100;
      return parseFloat(rendimiento.toFixed(2));
    });
    
    // Colores dinámicos: verde si positivo, rojo si negativo, gradiente según intensidad
    const colores = porcentajes.map(porcentaje => {
      if (porcentaje >= 10) return '#4CAF50'; // Verde fuerte
      if (porcentaje >= 5) return '#66BB6A';  // Verde medio
      if (porcentaje > 0) return '#81C784';   // Verde suave
      if (porcentaje === 0) return '#FFC107'; // Amarillo neutro
      if (porcentaje > -5) return '#FF7043';  // Rojo suave
      if (porcentaje > -10) return '#F44336'; // Rojo medio
      return '#D32F2F';                        // Rojo fuerte
    });
    
    this.dataGraficoBarrasPorcentaje = {
      labels: simbolos,
      datasets: [{
        label: 'Rendimiento (%)',
        data: porcentajes,
        backgroundColor: colores,
        borderColor: colores.map(c => c),
        borderWidth: 2,
        borderRadius: 8,
        borderSkipped: false
      }]
    };
  }


  
  redondearPrecio(): void {
    if (this.nuevoActivo.precio_compra) {
      this.nuevoActivo.precio_compra = parseFloat(this.nuevoActivo.precio_compra.toFixed(2));
      this.calcularInversionTotal();
    }
  }

mostrarHistorico: boolean = false;
simboloSeleccionado: string = '';
nombreGraficoHistorico: string = '';

// Configuración del gráfico histórico
tipoGraficoHistorico: 'line' = 'line';
dataGraficoHistorico: ChartConfiguration<'line'>['data'] = {
  labels: [],
  datasets: [{
    label: 'Precio de Cierre',
    data: [],
    borderColor: '#fff126',
    backgroundColor: 'rgba(255, 241, 38, 0.1)',
    fill: true,
    tension: 0.4
  }]
};

OpcionesGraficoHistorico: ChartConfiguration<'line'>['options'] = {
  responsive: true,
  plugins: {
    legend: {
      position: 'top',
      labels: { color: 'white' }
    },
    title: {
      display: true,
      text: 'Evolución Histórica',
      color: 'white',
      font: { size: 18 }
    }
  },
  scales: {
    y: {
      ticks: { color: 'white' },
      grid: { color: 'rgba(255,255,255,0.1)' }
    },
    x: {
      ticks: { color: 'white', maxRotation: 45, minRotation: 45 },
      grid: { color: 'rgba(255,255,255,0.1)' }
    }
  }
};

transaccionesActivo: any[] = [];

verHistoricoActivo(simbolo: string): void {
  this.simboloSeleccionado = simbolo;
  this.mostrarHistorico = true;
  
  const userId = localStorage.getItem('usuario');
  
  // Buscar el activo completo para obtener su tipo
  const activo = this.activos.find(a => a.simbolo === simbolo);
  const tipoActivo = this.mapearTipoActivo(activo?.tipo_activo || 'Stock');
  
  // Llamar a la API del histórico de precios
  this.http.get(`${this.apiUrl}historico-activo/?simbolo=${simbolo}&type=${tipoActivo}&interval=1week`)
    .subscribe({
      next: (res: any) => {
        if (!res.historico || res.historico.length === 0) {
          alert('No hay datos históricos disponibles para este activo.');
          this.cerrarHistorico();
          return;
        }
        
        const fechas = res.historico.map((item: any) => {
          const fecha = new Date(item.datetime);
          return fecha.toLocaleDateString('es-ES', { 
            day: '2-digit', 
            month: 'short',
            year: '2-digit'
          });
        });
        
        const precios = res.historico.map((item: any) => parseFloat(item.close));
        
        this.nombreGraficoHistorico = `${simbolo} - Último año (semanal)`;
        
        this.dataGraficoHistorico = {
          labels: fechas,
          datasets: [{
            label: `Precio de ${simbolo}`,
            data: precios,
            borderColor: '#fff126',
            backgroundColor: 'rgba(255, 241, 38, 0.1)',
            fill: true,
            tension: 0.4,
            borderWidth: 2
          }]
        };
      },
      error: (err) => {
        console.error('Error al obtener histórico:', err);
        const mensaje = err.error?.error || 'No se pudo cargar el histórico del activo.';
        alert(mensaje);
        this.cerrarHistorico();
      }
    });
  
  //Obtener transacciones del símbolo
  this.http.get(`${this.apiUrl}transacciones-simbolo/?simbolo=${simbolo}&user_id=${userId}`)
    .subscribe({
      next: (res: any) => {
        this.transaccionesActivo = res;
        console.log('Transacciones cargadas:', this.transaccionesActivo);
      },
      error: (err) => {
        console.error('Error al cargar transacciones:', err);
        this.transaccionesActivo = [];
      }
    });
}

private mapearTipoActivo(tipoLocal: string) : string {
  const mapeo :{ [key: string]: string } = {
    'Stock': 'stock',
    'Crypto': 'cryptocurrency',
    'Forex': 'forex',
    'ETF': 'etf',
    'Fondo': 'mutual_fund',
    'Index': 'index',
  };
  return mapeo[tipoLocal] || 'stock';
}





}