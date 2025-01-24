// Objeto global para almacenar los datos cargados dinámicamente
window.tableData = [];

// Función para cargar datos de un archivo CSV dinámicamente
async function loadDynamicTable(selectedFile) {
    try {
        const response = await fetch(`../assets/${selectedFile}`);
        const data = await response.text();

        const rows = data.split('\n').filter(row => row.trim() !== '');
        const headers = rows[0].split(',');

        // Guardar los datos procesados para usar en la tabla
        window.tableData = rows.slice(1).map(row => {
            const values = row.split(',');
            return headers.reduce((acc, header, index) => {
                acc[header] = values[index];
                return acc;
            }, {});
        });

        updateTable();
    } catch (error) {
        console.error('Error al cargar el archivo:', error);
    }
}



// Función para actualizar dinámicamente las opciones de "Nivel de análisis"
function updateAnalysisLevels(variable) {
    const levelSelector = document.getElementById('selectorTablaDin2');
    levelSelector.innerHTML = ''; // Limpiar las opciones actuales

    // Opciones generales
    const options = [
        { value: 'nacional', text: 'Nacional' },
        { value: 'region', text: 'Región' },
        { value: 'cadena_productiva', text: 'Cadena Productiva' },
        { value: 'tipo_empresa', text: 'Tipo de Empresa' }
    ];

    // Añadir "nivel_adopcion" si la variable seleccionada es "tecnologias"
    if (variable === 'tecnologias') {
        options.push({ value: 'nivel_adopcion', text: 'Nivel de Adopción' });
    }

    // Crear las nuevas opciones en el selector
    options.forEach(option => {
        const optionElement = document.createElement('option');
        optionElement.value = option.value;
        optionElement.textContent = option.text;
        levelSelector.appendChild(optionElement);
    });
}

// Función para actualizar la tabla dinámica en el HTML
function updateTable() {
    const level = document.getElementById('selectorTablaDin2').value; // Nivel seleccionado
    const variable = document.getElementById('selectorTablaDin1').value; // Variable seleccionada

    let groupedData;

    if (level === "nacional") {
        // Agrupación solo por la variable seleccionada
        groupedData = window.tableData.reduce((acc, row) => {
            const key = row[variable];
            if (!key) return acc;
            if (!acc[key]) {
                acc[key] = { count: 0 };
            }
            acc[key].count += 1;
            return acc;
        }, {});
    } else {
        // Agrupación por nivel y variable simultáneamente
        groupedData = window.tableData.reduce((acc, row) => {
            const levelKey = row[level];
            const variableKey = row[variable];
            if (!variableKey || !levelKey) return acc;

            const key = `${levelKey} - ${variableKey}`;
            if (!acc[key]) {
                acc[key] = { count: 0, level: levelKey };
            }
            acc[key].count += 1;
            return acc;
        }, {});

        // Calcular totales por nivel
        const levelTotals = Object.values(groupedData).reduce((acc, { level, count }) => {
            acc[level] = (acc[level] || 0) + count;
            return acc;
        }, {});

        // Añadir el total al groupedData
        Object.entries(groupedData).forEach(([key, data]) => {
            groupedData[key].totalForLevel = levelTotals[data.level];
        });
    }

    const tableBody = document.getElementById('tableBody');
    const tableHead = document.querySelector('#dynamicTable thead tr');

    // Limpiar encabezados y cuerpo de la tabla
    tableBody.innerHTML = '';
    tableHead.innerHTML = '';

    // Configurar encabezados dinámicamente
    if (level !== "nacional") {
        const thLevel = document.createElement('th');
        thLevel.textContent = level; // Nivel dinámico (ej. Región, Comuna)
        tableHead.appendChild(thLevel);
    }

    const thGroup = document.createElement('th');
    thGroup.textContent = "Agrupación";
    tableHead.appendChild(thGroup);

    const thCount = document.createElement('th');
    thCount.textContent = "Cantidad";
    tableHead.appendChild(thCount);

    const thPercentage = document.createElement('th');
    thPercentage.textContent = "Porcentaje";
    tableHead.appendChild(thPercentage);

    // Construir filas dinámicamente
    Object.entries(groupedData).forEach(([key, { count, level: levelValue, totalForLevel }]) => {
        const tr = document.createElement('tr');

        if (level !== "nacional") {
            // Agregar columna "Nivel" solo si no es "nacional"
            const tdLevel = document.createElement('td');
            tdLevel.textContent = levelValue || ''; // Mostrar nivel (ej. Región, Comuna)
            tr.appendChild(tdLevel);
        }

        // Columna "Agrupación"
        const tdKey = document.createElement('td');
        tdKey.textContent = level === "nacional" ? key : key.split(' - ')[1]; // Mostrar agrupación según nivel
        tr.appendChild(tdKey);

        // Columna "Cantidad"
        const tdCount = document.createElement('td');
        tdCount.textContent = count;
        tr.appendChild(tdCount);

        // Columna "Porcentaje"
        const tdPercentage = document.createElement('td');
        if (totalForLevel && level !== "nacional") {
            // Porcentaje por nivel
            tdPercentage.textContent = ((count / totalForLevel) * 100).toFixed(2) + '%';
        } else {
            // Porcentaje general (nacional)
            const total = Object.values(groupedData).reduce((sum, group) => sum + group.count, 0);
            tdPercentage.textContent = ((count / total) * 100).toFixed(2) + '%';
        }
        tr.appendChild(tdPercentage);

        tableBody.appendChild(tr);
    });
}



// Generar gráfico dinámico con ECharts
function generateChart() {
    const level = document.getElementById('selectorTablaDin2').value; // Nivel seleccionado
    const variable = document.getElementById('selectorTablaDin1').value; // Variable seleccionada

    let groupedData;

    if (level === "nacional") {
        // Agrupación por la variable seleccionada
        groupedData = window.tableData.reduce((acc, row) => {
            const key = row[variable];
            if (!key) return acc;
            if (!acc[key]) {
                acc[key] = 0;
            }
            acc[key] += 1;
            return acc;
        }, {});

        // Convertir a porcentajes
        const total = Object.values(groupedData).reduce((sum, count) => sum + count, 0);
        const chartData = Object.entries(groupedData).map(([key, value]) => ({
            name: key,
            value: ((value / total) * 100).toFixed(2)
        }));

        // Configuración para Nightingale Chart
        const option = {
            title: {
                text: 'Distribución Nacional',
                left: 'center'
            },
            tooltip: {
                trigger: 'item',
                formatter: '{a} <br/>{b}: {c}%'
            },
            legend: {
                top: 'bottom'
            },
            series: [
                {
                    name: 'Distribución',
                    type: 'pie',
                    radius: ['30%', '70%'],
                    roseType: 'radius',
                    itemStyle: {
                        borderRadius: 5
                    },
                    data: chartData
                }
            ]
        };

        // Renderizar gráfico
        renderChart(option);
    } else {
        // Agrupación por nivel y variable
        groupedData = window.tableData.reduce((acc, row) => {
            const levelKey = row[level];
            const variableKey = row[variable];
            if (!variableKey || !levelKey) return acc;

            if (!acc[levelKey]) {
                acc[levelKey] = {};
            }
            acc[levelKey][variableKey] = (acc[levelKey][variableKey] || 0) + 1;
            return acc;
        }, {});

        // Formatear datos para barras dodge
        const categories = Object.keys(groupedData);
        const subCategories = Array.from(
            new Set(Object.values(groupedData).flatMap(group => Object.keys(group)))
        );

        const seriesData = subCategories.map(subCat => ({
            name: subCat,
            type: 'bar',
            data: categories.map(cat => groupedData[cat][subCat] || 0)
        }));

        // Configuración para gráfico de barras dodge
        const option = {
            title: {
                text: 'Distribución Regional',
                left: 'center'
            },
            tooltip: {
                trigger: 'axis',
                axisPointer: { type: 'shadow' }
            },
            legend: {
                top: 'bottom'
            },
            xAxis: {
                type: 'category',
                data: categories
            },
            yAxis: {
                type: 'value'
            },
            series: seriesData
        };

        // Renderizar gráfico
        renderChart(option);
    }
}

// Renderizar gráfico en ECharts
function renderChart(option) {
    const chartContainer = document.getElementById('chartContainer');
    if (!chartInstance) {
        chartInstance = echarts.init(chartContainer);
    }
    chartInstance.setOption(option);
}


// Manejar cambios en el selector de variable
document.getElementById('selectorTablaDin1').addEventListener('change', () => {
    const selectedVariable = document.getElementById('selectorTablaDin1').value;

    // Mapeo de variables a archivos
    const variableToFileMap = {
        "agrupacion_tecnocreativa": "df_select.csv",
        "tecnologias": "d_tecnologias.csv",
        "herramientas_diferenciacion": "d_diferenciacion.csv",
        "interaccion": "d_interaccion_sect_no_creativos.csv",
        "tendencias": "d_tendencias_tecnocreativas.csv",
        "brechas": "d_brechas.csv",
        "tipo_empresa": "df_select.csv"
    };

    // Actualizar las opciones de "Nivel de análisis" dinámicamente
    updateAnalysisLevels(selectedVariable);

    // Cargar los datos del archivo correspondiente
    const selectedFile = variableToFileMap[selectedVariable];
    if (selectedFile) {
        loadDynamicTable(selectedFile);
    } else {
        console.error("No se encontró un archivo para la variable seleccionada.");
    }
});

// Manejar cambios en el selector de nivel de análisis
document.getElementById('selectorTablaDin2').addEventListener('change', updateTable);
