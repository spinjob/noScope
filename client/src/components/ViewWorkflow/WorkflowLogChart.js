import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
  } from 'chart.js'
  import { Chart } from 'react-chartjs-2'
  import {Line} from 'react-chartjs-2';


  const WorkflowLogChart = ({workflowLogs}) => {
    ChartJS.register(
        CategoryScale,
        LinearScale,
        PointElement,
        LineElement,
        Title,
        Tooltip,
        Legend
      )
      const data = {
        labels: ["January", "February", "March", "April", "May", "June", "July"],
        datasets: [
          {
            label: "My First dataset",
            fill: false,
            lineTension: 0.1,
            backgroundColor: "green",
            borderColor: "blue",
            borderCapStyle: "butt",
            borderDash: [15, 5],
            drawOnChartArea: false,
            borderDashOffset: 0.0,
            borderJoinStyle: "miter",
            pointBorderColor: "rgba(75,192,192,1)",
            pointBackgroundColor: "#fff",
            pointBorderWidth: 1,
            pointHoverRadius: 5,
            pointHoverBackgroundColor: "rgba(75,192,192,1)",
            pointHoverBorderColor: "rgba(220,220,220,1)",
            pointHoverBorderWidth: 2,
            pointRadius: 1,
            pointHitRadius: 10,
            data: [65, 59, 80, 81, 56, 55, 40],
            borderWidth: 0 // This is mandatory
          }
        ]
      };
    
      const options = {
        legend: {
          display: true,
          labels: {
            boxWidth: 50,
            fontSize: 25,
            fontColor: "gray"
          }
        },
        responsive:true,
        maintainAspectRatio: false
      };


      return (
        <div>
            <Line style={{height: 300}} options={options} data={data}/>
        </div>
      )
  }

  export default WorkflowLogChart