import { Directive, ElementRef, Input, OnChanges, SimpleChanges, Renderer2 } from '@angular/core';

@Directive({
  selector: '[appCountUp]',
  standalone: true
})
export class CountUpDirective implements OnChanges {
  @Input('appCountUp') endValue: number | string | undefined | null;
  @Input() duration: number = 1000;
  @Input() prefix: string = '';
  @Input() suffix: string = '';
  @Input() isAmount: boolean = false;
  @Input() decimals: number = 0;

  constructor(private el: ElementRef, private renderer: Renderer2) { }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['endValue'] && this.endValue !== undefined && this.endValue !== null) {
      if (this.decimals === 0) {
        const strVal = this.endValue.toString();
        if (strVal.includes('.')) {
          this.decimals = strVal.split('.')[1].length;
        }
      }
      this.animateCount(Number(this.endValue) || 0);
    }
  }

  private animateCount(target: number) {
    const startValue = 0;
    let startTime: number | null = null;

    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / this.duration, 1);

      const currentValue = startValue + (target - startValue) * progress;

      this.renderer.setProperty(
        this.el.nativeElement,
        'innerText',
        this.prefix + this.format(currentValue) + this.suffix
      );

      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        this.renderer.setProperty(
          this.el.nativeElement,
          'innerText',
          this.prefix + this.format(target) + this.suffix
        );
      }
    };

    requestAnimationFrame(step);
  }

  private format(value: number): string {
    if (!this.isAmount) {
      return this.decimals > 0 ? value.toFixed(this.decimals) : Math.floor(value).toString();
    }

    if (value == null || isNaN(value)) return '0';

    if (value >= 10000000) {
      return (value / 10000000).toFixed(2) + 'Cr';
    } else if (value >= 100000) {
      return (value / 100000).toFixed(2) + 'L';
    } else if (value >= 1000) {
      return (value / 1000).toFixed(2) + 'K';
    } else {
      return value.toFixed(2);
    }
  }
}
