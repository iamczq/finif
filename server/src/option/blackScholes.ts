export class blackScholes {
  getPremium(
    right: string,
    S: number,
    X: number,
    t: number,
    r: number,
    v: number,
  ) {
    t = t / 365;

    const d1 =
      (Math.log(S / X) + (r + Math.pow(v, 2) / 2) * t) / (v * Math.sqrt(t));
    const d2 = d1 - v * Math.sqrt(t);

    if (right.toUpperCase().indexOf('C') !== -1) {
      return (
        S * this.getNormDist(d1) - X * Math.exp(-(r * t)) * this.getNormDist(d2)
      );
    } else if (right.toUpperCase().indexOf('P') !== -1) {
      return (
        X * Math.exp(-(r * t)) * this.getNormDist(-d2) -
        S * this.getNormDist(-d1)
      );
    }

    return 0;
  }

  getImpliedVolatility(right: any, S: any, X: any, t: any, r: any, P: number) {
    let test = 0;
    let volatility = 0.0001;
    let upper = 999.99;
    let lower = 0;
    let range = Math.abs(lower - upper);

    while (true) {
      test = this.getPremium(right, S, X, t, r, volatility);

      if (test > P) {
        upper = volatility;
        volatility = (lower + upper) / 2;
      } else {
        lower = volatility;
        volatility = (lower + upper) / 2;
      }

      range = Math.abs(lower - upper);

      if (range < 0.0001) break;
    }

    return volatility;
  }

  getDelta(
    right: 'C' | 'P',
    S: number,
    X: number,
    t: number,
    r: number,
    v: number,
  ) {
    t = t / 365;

    const d1 =
      (Math.log(S / X) + (r + Math.pow(v, 2) / 2) * t) / (v * Math.sqrt(t));

    if (right.toUpperCase().indexOf('C') !== -1) {
      return this.getNormDist(d1);
    } else if (right.toUpperCase().indexOf('P') !== -1) {
      return this.getNormDist(d1) - 1;
    }

    return 0;
  }

  getGamma(S: number, X: number, t: number, r: number, v: number) {
    t = t / 365;

    const d1 =
      (Math.log(S / X) + (r + Math.pow(v, 2) / 2) * t) / (v * Math.sqrt(t));

    return (
      Math.exp(-Math.pow(d1, 2) / 2) /
      Math.sqrt(2 * Math.PI) /
      (S * v * Math.sqrt(t))
    );
  }

  getVega(S: number, X: number, t: number, r: number, v: number) {
    t = t / 365;

    const d1 =
      (Math.log(S / X) + (r + Math.pow(v, 2) / 2) * t) / (v * Math.sqrt(t));

    return (
      (S *
        Math.sqrt(t) *
        (Math.exp(-Math.pow(d1, 2) / 2) / Math.sqrt(2 * Math.PI))) /
      100
    );
  }

  getTheta(
    right: string,
    S: number,
    X: number,
    t: number,
    r: number,
    v: number,
  ) {
    t = t / 365;

    const d1 =
      (Math.log(S / X) + (r + Math.pow(v, 2) / 2) * t) / (v * Math.sqrt(t));
    const d2 = d1 - v * Math.sqrt(t);

    if (right.toUpperCase().indexOf('C') !== -1) {
      return (
        (-(S * (Math.exp(-Math.pow(d1, 2) / 2) / Math.sqrt(2 * Math.PI)) * v) /
          (2 * Math.sqrt(t)) -
          r * X * Math.exp(-(r * t)) * this.getNormDist(d2)) /
        365
      );
    } else if (right.toUpperCase().indexOf('P') !== -1) {
      return (
        (-(S * (Math.exp(-Math.pow(d1, 2) / 2) / Math.sqrt(2 * Math.PI)) * v) /
          (2 * Math.sqrt(t)) +
          r * X * Math.exp(-(r * t)) * this.getNormDist(-d2)) /
        365
      );
    }

    return 0;
  }

  getRho(right: string, S: number, X: number, t: number, r: number, v: number) {
    t = t / 365;

    const d1 =
      (Math.log(S / X) + (r + Math.pow(v, 2) / 2) * t) / (v * Math.sqrt(t));
    const d2 = d1 - v * Math.sqrt(t);

    if (right.toUpperCase().indexOf('C') !== -1) {
      return (X * t * Math.exp(-(r * t)) * this.getNormDist(d2)) / 100;
    } else if (right.toUpperCase().indexOf('P') !== -1) {
      return (-X * t * Math.exp(-(r * t)) * this.getNormDist(-d2)) / 100;
    }

    return 0;
  }

  getNormDist(x: number) {
    const d1 = 0.049867347,
      d2 = 0.0211410061,
      d3 = 0.0032776263,
      d4 = 0.0000380036,
      d5 = 0.0000488906,
      d6 = 0.000005383;
    const a = Math.abs(x);
    let t = 1.0 + a * (d1 + a * (d2 + a * (d3 + a * (d4 + a * (d5 + a * d6)))));

    t *= t;
    t *= t;
    t *= t;
    t *= t;
    t = 1.0 / (t + t);

    if (x >= 0) t = 1 - t;

    return t;
  }
}
