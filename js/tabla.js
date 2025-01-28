

// Inicializar eventos para tablas
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('selectorTablaDin1').addEventListener('change', () => {
        const selectedVariable = document.getElementById('selectorTablaDin1').value;
        const fileMap = {
            "agrupacion_tecnocreativa": "df_select.csv",
            "tecnologias": "d_tecnologias.csv"
        };

        const selectedFile = fileMap[selectedVariable];
        if (selectedFile) loadDynamicTable(selectedFile).then(() => {
            updateTable();
        });
    });

    document.getElementById('selectorTablaDin2').addEventListener('change', updateTable);

    // Cargar datos iniciales
    loadDynamicTable('df_select.csv').then(() => {
        updateTable();
    });
});


function updateTable(groupedData, level, variable) {
    const tableBody = document.getElementById('tableBody');
    const tableHead = document.querySelector('#dynamicTable thead tr');

    if (!tableBody || !tableHead) {
        console.error('La tabla dinámica no está presente en el DOM.');
        return;
    }

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



function loadAndGenerateTable() {
    const level = document.getElementById('selectorTecnoAnalisis').value;
    const variable = document.getElementById('selectorGeneralesInteres').value;

    // Calcula los datos agrupados
    const groupedData = calculateGroupedData(level, variable);

    // Actualiza la tabla con los datos calculados
    updateTable(groupedData, level, variable);
}