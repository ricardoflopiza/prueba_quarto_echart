// Initialize ECharts instances
function renderCharts() {
  const chart1 = echarts.init(document.getElementById('chart1'));
  const chart3 = echarts.init(document.getElementById('chart3'));

  // Example data for bar chart (Chart 1)
  const chart1Options = {
      xAxis: { type: 'category', data: ['A', 'B', 'C', 'D', 'E'] },
      yAxis: { type: 'value' },
      series: [
          { data: [10, 20, 30, 40, 10], type: 'bar', itemStyle: { color: '#6a5acd' } },
      ],
  };

  // Example data for pie chart (Chart 3)
  const chart3Options = {
      tooltip: { trigger: 'item' },
      series: [
          {
              type: 'pie',
              radius: '70%',
              data: [
                  { value: 32, name: 'Servicios creativos' },
                  { value: 23, name: 'Nuevos medios' },
                  { value: 22, name: 'Cultura y entretenimiento' },
                  { value: 20, name: 'Fintech' },
                  { value: 8, name: 'Música' },
              ],
          },
      ],
  };

  chart1.setOption(chart1Options);
  chart3.setOption(chart3Options);

  // Resize charts on window resize
  window.addEventListener('resize', () => {
      chart1.resize();
      chart3.resize();
  });
}

// Call renderCharts when DOM is loaded
document.addEventListener('DOMContentLoaded', renderCharts);

function updateContent() {
    const selector1 = document.getElementById("selector1").value;
    const selector2 = document.getElementById("selector2").value;
    const dynamicIframe = document.getElementById("dynamicIframe");
    
    const fileName = `www/${selector1}_${selector2}.html`;
    
    console.log(`Cargando gráfico: ${fileName}`); // Debugging
    
    dynamicIframe.src = fileName;
    }