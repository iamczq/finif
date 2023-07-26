import {
  AfterViewChecked,
  Component,
  ElementRef,
  Input,
  OnChanges,
  ViewChild,
} from '@angular/core';
import { Chart, ChartItem } from 'chart.js/auto';
import { BlackScholes } from 'src/app/services/black-scholes.service';

@Component({
  selector: 'app-emulator',
  templateUrl: './emulator.component.html',
  styleUrls: ['./emulator.component.scss'],
})
export class EmulatorComponent {
  @ViewChild('chart') chartEl: ElementRef<ChartItem>;
  @Input() type: string = 'P';
  @Input() underlyingPrice: number = 3850;
  @Input() executionPrice: number = 3500;
  @Input() remainDays: number = 180;
  @Input() rate: number = 0.03;
  @Input() useIv: boolean = true;
  @Input() iv: number = 0.13;

  data: number[];
  chart: Chart<'line', any, unknown>;

  private chartLineColors = [
    'rgb(255, 99, 132)',
    'rgb(54, 162, 235)',
    'rgb(255, 206, 86)',
    'rgb(75, 192, 192)',
    'rgb(153, 102, 255)',
    'rgb(255, 159, 64)',
    'rgb(255, 0, 0)',
    'rgb(0, 255, 0)',
    'rgb(0, 0, 255)',
    'rgb(128, 128, 128)',
  ];
  private currentColorIndex = 0;

  constructor(private bs: BlackScholes) {}

  public calculate() {
    const days = [...Array(this.remainDays + 1).keys()];
    const data = days.map((day) => {
      return this.bs.getTheta(
        this.type,
        this.underlyingPrice,
        this.executionPrice,
        day,
        this.rate,
        this.iv
      );
    });

    return {
      labels: days,
      data: data,
    };
  }

  reCalculate() {
    const data = this.calculate();
    const i = this.chart.data.datasets.length - 1;
    this.chart.data.datasets[i].data = data.data;
    this.chart.update();
  }

  add() {
    const data = this.calculate();
    const colorIndex = this.currentColorIndex++ % this.chartLineColors.length;
    const color = this.chartLineColors[colorIndex];
    if (!this.chart) {
      this.chart = new Chart(this.chartEl.nativeElement, {
        type: 'line',
        data: {
          labels: data.labels,
          datasets: [
            {
              label: colorIndex.toString(),
              backgroundColor: color,
              data: data.data,
            },
          ],
        },
        options: {
          responsive: true,
        },
      });
    } else {
      this.chart.data.datasets.push({
        label: colorIndex.toString(),
        backgroundColor: color,
        data: data.data,
      });
    }

    this.chart.update();
  }
}
