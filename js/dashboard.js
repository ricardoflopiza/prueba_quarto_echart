/************************************************************
  1. Mapeo de variable -> archivo CSV
*************************************************************/
const variableToFileMap = {
    // Características Generales
    "genero": "df_select.csv",
    "tamano_empresa_num_trab": "df_select.csv",
    "rango_ventas": "df_select.csv",
    "exportaciones": "df_select.csv",
    "porc_exportaciones": "df_select.csv",
    "financiamiento": "d_fuentes_financiamiento.csv",
    "internacionalizacion": "df_select.csv",
    
    // Características Tecnocreativas
    "agrupacion_tecnocreativa": "df_select.csv",
    "tecnologias": "d_tecnologias.csv",
    "herramientas_diferenciacion": "d_diferenciacion.csv",
    "interaccion": "d_interaccion_sect_no_creativos.csv",
    "tendencias": "d_tendencias_tecno.csv",
    "brechas": "d_brechas.csv"
  };
  
  // Opcional: Para no volver a cargar el mismo archivo muchas veces, podemos
  // almacenar los datos en caché según el archivo.
  const dataCache = {};
  
  /************************************************************
    2. Función para cargar datos desde CSV
       (utiliza caché si ya se han cargado antes)
  *************************************************************/
  async function loadDataFromCSV(fileName) {
    // Si ya está en caché, devuélvelo directamente
    if (dataCache[fileName]) {
      return dataCache[fileName];
    }
    try {
      const response = await fetch(`../assets/${fileName}`);
      const csvText = await response.text();
      
      const rows = csvText.split('\n').filter(row => row.trim() !== '');
      const headers = rows[0].split(',');
  
      const parsedData = rows.slice(1).map(row => {
        const values = row.split(',');
        const obj = {};
        headers.forEach((header, idx) => {
          obj[header] = values[idx] || "";
        });
        return obj;
      });
  
      // Guardar en caché
      dataCache[fileName] = parsedData;
      return parsedData;
    } catch (error) {
      console.error("Error al cargar el archivo CSV:", error);
      return [];
    }
  }
  

// Función para actualizar dinámicamente las opciones de "Nivel de análisis"
function updateAnalysisLevels(variable,toupdate) {

    if (variable === 'tecnologias') {
    const levelSelector = document.getElementById(toupdate);
    levelSelector.innerHTML = ''; // Limpiar las opciones actuales

    // Opciones generales
    const options = [
        { value: 'nacional', text: 'Nacional' },
        { value: 'region', text: 'Región' },
        { value: 'cadena_productiva', text: 'Cadena Productiva' },
        { value: 'tipo_empresa', text: 'Tipo de Empresa' }
    ];

    // Añadir "nivel_adopcion" si la variable seleccionada es "tecnologias"

        options.push({ value: 'nivel_adopcion', text: 'Nivel de Adopción' });

    // Crear las nuevas opciones en el selector
    options.forEach(option => {
        const optionElement = document.createElement('option');
        optionElement.value = option.value;
        optionElement.textContent = option.text;
        levelSelector.appendChild(optionElement);
    });

}

}

  /************************************************************
    3. Función de actualización del gráfico
       Parámetros:
       - variableSelectId:  ID del <select> que elige la variable
       - levelSelectId:     ID del <select> que elige el nivel de análisis
       - chartContainerId:  ID del contenedor donde se renderiza el gráfico
       - chartTitle:        Título del gráfico (opcional)
  *************************************************************/
  let chartInstances = {}; // Podremos guardar instancias ECharts por contenedor
  
  async function updateChart(variableSelectId, levelSelectId, chartContainerId, chartTitle) {
    const variable = document.getElementById(variableSelectId).value;
    const level = document.getElementById(levelSelectId).value;
    const container = document.getElementById(chartContainerId);
  

    updateAnalysisLevels(variable, "selector1b");

    // 1. Encontrar archivo CSV para esta variable
    const fileName = variableToFileMap[variable];
    if (!fileName) {
      console.error("No se encontró archivo CSV para la variable:", variable);
      return;
    }
  
    // 2. Cargar datos (con caché)
    const data = await loadDataFromCSV(fileName);
    if (!data || data.length === 0) {
      console.error("No hay datos para generar gráfico.");
      return;
    }
  
    // 3. Agrupar datos y generar las series/categorías
    let option;
    if (level === "nacional") {
      // Pie Chart: distribución nacional
      const grouped = data.reduce((acc, row) => {
        const key = row[variable];
        if (!key) return acc;
        acc[key] = (acc[key] || 0) + 1;
        return acc;
      }, {});
  
      const total = Object.values(grouped).reduce((sum, v) => sum + v, 0);
      const pieData = Object.entries(grouped).map(([k, v]) => ({
        name: k,
        value: ((v / total) * 100).toFixed(2)
      }));
  
      option = {
        title: { text: chartTitle || "Distribución Nacional", left: "center" },
        tooltip: { trigger: "item", formatter: "{a} <br/>{b}: {c}%" },
        legend: { top: "bottom" },
        series: [
          {
            name: "Distribución",
            type: "pie",
            radius: ["30%", "70%"],
            roseType: "radius",
            itemStyle: { borderRadius: 5 },
            data: pieData
          }
        ]
      };
    } else {
      // Bar Chart: agrupación por nivel (ej: regiones, cadena_productiva)
      // 1) Agrupar
      const grouped = {};
      data.forEach(row => {
        const levelKey = row[level];
        const varKey   = row[variable];
        if (!levelKey || !varKey) return;
        if (!grouped[levelKey]) {
          grouped[levelKey] = {};
        }
        grouped[levelKey][varKey] = (grouped[levelKey][varKey] || 0) + 1;
      });
  
      // 2) Preparar categorías (eje X) y subcategorías
      const categories = Object.keys(grouped); 
      const subCategories = Array.from(
        new Set(
          Object.values(grouped).flatMap(obj => Object.keys(obj))
        )
      );
      
      // 3) Construir series
      const series = subCategories.map(subCat => {
        return {
          name: subCat,
          type: "bar",
          data: categories.map(cat => grouped[cat][subCat] || 0)
        };
      });
  
// Crear opción del gráfico con tooltip personalizado
option = {
    title: {
      text: chartTitle || `Distribución por ${level}`,
      left: "center",
    },
    tooltip: {
      trigger: "axis",
      axisPointer: { type: "shadow" },
      formatter: function (params) {
        let total = 0;
  
        // Calcular el total de la barra
        params.forEach((item) => {
          total += Number(item.value); // Usar el valor de cada serie
        });
  
        // Ordenar params de mayor a menor según el valor
        params.sort((a, b) => b.value - a.value);
  
        // Crear contenido del tooltip
        let res = `<div><strong>${params[0].name}</strong></div>`; // Nombre de la categoría
        params.forEach((item) => {
          const value = Number(item.value);
          if (value > 0) {
            const percent = ((value / total) * 100).toFixed(2); // Calcular porcentaje
            res += `
              <div style='margin:5px 0;'>
                <span style='display:inline-block;width:10px;height:10px;border-radius:50%;background:${item.color};margin-right:5px;'></span>
                ${item.seriesName}: ${value} (${percent}%)
              </div>
            `;
          }
        });
  
        // Mostrar el total al final
        res += `<div><strong>Total: ${total}</strong></div>`;
        return res;
      },
    },
    legend: { top: "bottom" },
    // Ejes invertidos
    xAxis: {
      type: "value", // Eje X para valores numéricos
      name: "Valores",
    },
    yAxis: {
      type: "category", // Eje Y para categorías
      data: categories, // Las categorías en el eje Y
      name: "Categorías",
    },
    series: series, // Las series generadas dinámicamente
  };
  
    }
  
    // 4. Renderizar el gráfico con ECharts
    if (!container) {
      console.error("No se encontró contenedor para el ID:", chartContainerId);
      return;
    }
    if (chartInstances[chartContainerId]) {
      // Dispose la instancia previa para limpiar
      chartInstances[chartContainerId].dispose();
    }
    const chart = echarts.init(container);
    chart.setOption(option);
    chartInstances[chartContainerId] = chart;
  }
  
  /************************************************************
    4. Listeners para los 2 conjuntos de selectores
  *************************************************************/
//   document.addEventListener("DOMContentLoaded", () => {
    // 1) Primer set: características generales
    const selVarGenerales = document.getElementById("selectorGeneralesInteres");
    const selNivelGenerales = document.getElementById("selectorTecnoAnalisis");
  
    // Al cambiar la variable o el nivel, actualizar el gráfico
    selVarGenerales.addEventListener("change", () => {


        
      updateChart("selectorGeneralesInteres", "selectorTecnoAnalisis", "chartContainer", "Características Generales");
    });
    selNivelGenerales.addEventListener("change", () => {
      updateChart("selectorGeneralesInteres", "selectorTecnoAnalisis", "chartContainer", "Características Generales");
    });
  
    // 2) Segundo set: características tecnocreativas
    const selVarTecno = document.getElementById("selector2b");
    const selNivelTecno = document.getElementById("selector1b");


  
    selVarTecno.addEventListener("change", () => {
      updateChart("selector2b", "selector1b", "chartContainer2", "Características Tecnocreativas");
    });
    selNivelTecno.addEventListener("change", () => {
      updateChart("selector2b", "selector1b", "chartContainer2", "Características Tecnocreativas");
    });
  
    // OPCIONAL: Disparar carga inicial (ej: por defecto)
    updateChart("selectorGeneralesInteres", "selectorTecnoAnalisis", "chartContainer", "Características Generales");
    updateChart("selector2b", "selector1b", "chartContainer2", "Características Tecnocreativas");
//   });
  

// let chartInstance = null; // Instancia global para ECharts
// console.log('Hola desde el dashboard.js');


// // Generar gráfico dinámico con ECharts
// function generateChart() {
//     const level = document.getElementById('selectorTecnoAnalisis').value; // Nivel seleccionado
//     const variable = document.getElementById('selectorGeneralesInteres').value; // Variable seleccionada

//     let groupedData;

//     if (level === "nacional") {
//         groupedData = window.tableData.reduce((acc, row) => {
//             const key = row[variable];
//             if (!key) return acc;
//             if (!acc[key]) {
//                 acc[key] = 0;
//             }
//             acc[key] += 1;
//             return acc;
//         }, {});

//         const total = Object.values(groupedData).reduce((sum, count) => sum + count, 0);
//         const chartData = Object.entries(groupedData).map(([key, value]) => ({
//             name: key,
//             value: ((value / total) * 100).toFixed(2)
//         }));

//         const option = {
//             title: { text: 'Distribución Nacional', left: 'center' },
//             tooltip: { trigger: 'item', formatter: '{a} <br/>{b}: {c}%' },
//             legend: { top: 'bottom' },
//             series: [{
//                 name: 'Distribución',
//                 type: 'pie',
//                 radius: ['30%', '70%'],
//                 roseType: 'radius',
//                 itemStyle: { borderRadius: 5 },
//                 data: chartData
//             }]
//         };

//         renderChart(option);

//     } else {
//         // Agrupación por nivel y variable
//         groupedData = window.tableData.reduce((acc, row) => {
//             const levelKey = row[level];
//             const variableKey = row[variable];
//             if (!variableKey || !levelKey) return acc;

//             if (!acc[levelKey]) {
//                 acc[levelKey] = {};
//             }
//             acc[levelKey][variableKey] = (acc[levelKey][variableKey] || 0) + 1;
//             return acc;
//         }, {});

//         // Formatear datos para barras dodge
//         const categories = Object.keys(groupedData);
//         const subCategories = Array.from(
//             new Set(Object.values(groupedData).flatMap(group => Object.keys(group)))
//         );

//         const seriesData = subCategories.map(subCat => ({
//             name: subCat,
//             type: 'bar',
//             data: categories.map(cat => groupedData[cat][subCat] || 0)
//         }));

//         // Configuración para gráfico de barras dodge
//         const option = {
//             title: {
//                 text: 'Distribución Regional',
//                 left: 'center'
//             },
//             tooltip: {
//                 trigger: 'axis',
//                 axisPointer: { type: 'shadow' }
//             },
//             legend: {
//                 top: 'bottom'
//             },
//             xAxis: {
//                 type: 'category',
//                 data: categories
//             },
//             yAxis: {
//                 type: 'value'
//             },
//             series: seriesData
//         };

//         // Renderizar gráfico
//         renderChart(option);
//     }
// }

// // Función para renderizar un gráfico con ECharts
// function renderChart(option) {
//     const chartContainer = document.getElementById('chartContainer');
//     if (chartInstance) chartInstance.dispose();
//     chartInstance = echarts.init(chartContainer);
//     chartInstance.setOption(option);
// }


// // Manejar cambios en el selector de variable
// document.getElementById('selectorTecnoAnalisis').addEventListener('change', () => {
//     const selectedVariable = document.getElementById('selectorTecnoAnalisis').value;

//     // Mapeo de variables a archivos
//     const variableToFileMap = {
//         "agrupacion_tecnocreativa": "df_select.csv",
//         "tecnologias": "d_tecnologias.csv",
//         "herramientas_diferenciacion": "d_diferenciacion.csv",
//         "interaccion": "d_interaccion_sect_no_creativos.csv",
//         "tendencias": "d_tendencias_tecno.csv",
//         "brechas": "d_brechas.csv",
//         "tipo_empresa": "df_select.csv",
//         "genero": "df_select.csv",
//         "tamano_empresa_num_trab": "df_select.csv",
//         "rango_ventas": "df_select.csv",
//         "exportaciones": "df_select.csv",
//         "exportaciones_porc_ingreso": "df_select.csv",
//         "financiamiento": "d_fuentes_financiamiento.csv",
//         "internacionalizacion": "df_select.csv"
//     };

//     // Actualizar las opciones de "Nivel de análisis" dinámicamente
//     updateAnalysisLevels(selectedVariable);

//     // Cargar los datos del archivo correspondiente
//     const selectedFile = variableToFileMap[selectedVariable];
//     if (selectedFile) {
//         loadDynamicTable(selectedFile);
//     } else {
//         console.error("No se encontró un archivo para la variable seleccionada.");
//     }
// });


//     // Cargar datos iniciales
//     console.log('Cargando archivo inicial: df_select.csv');
//     loadDynamicTable('df_select.csv').then(() => {
//         generateChart();
//     });


