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
type Data = {
  labels: number[];
  data: number[];
};

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
  private colorIndex = 0;

  constructor(private bs: BlackScholes) {}

  public calculate(): Data {
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

  private setLabels(labels: number[]) {
    const oldLabel = this.chart.data.labels ?? [];
    if (oldLabel.length < labels.length) {
      this.chart.data.labels = labels;
    }
  }

  private setData(data: number[], isRefresh: boolean = false) {
    if (isRefresh) {
      const i = this.chart.data.datasets.length - 1;
      this.chart.data.datasets[i].data = data;
    } else {
      this.chart.data.datasets.push({
        label: this.colorIndex.toString(),
        backgroundColor: this.getNextColor(),
        data: data,
      });
    }
  }

  private getNextColor(): string {
    const color = this.chartLineColors[this.colorIndex];
    this.colorIndex = (this.colorIndex + 1) % this.chartLineColors.length;
    return color;
  }

  reCalculate() {
    if (this.chart) {
      const data = this.calculate();
      this.setLabels(data.labels);
      this.setData(data.data, true);

      this.chart.update();
    }
  }

  add() {
    const data = this.calculate();
    if (!this.chart) {
      const color = this.getNextColor();
      this.chart = new Chart(this.chartEl.nativeElement, {
        type: 'line',
        data: {
          labels: data.labels,
          datasets: [
            {
              label: this.colorIndex.toString(),
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
      this.setLabels(data.labels);
      this.setData(data.data);
    }

    this.chart.update();
  }
}
