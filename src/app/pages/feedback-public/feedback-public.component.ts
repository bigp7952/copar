import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  standalone: true,
  selector: 'app-feedback-public-page',
  template: `
    <div class="page-card">
      <h2>Feedback client</h2>
      <p>Token : {{ token }}</p>
      <p>Formulaire public de note et commentaire à venir.</p>
    </div>
  `,
  styles: [
    `
      .page-card {
        border-radius: 24px;
        padding: 32px;
        background: #ffffff;
        box-shadow: 0 10px 40px rgba(15, 23, 42, 0.05);
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FeedbackPublicComponent {
  constructor(private readonly route: ActivatedRoute) {}

  get token(): string | null {
    return this.route.snapshot.paramMap.get('token');
  }
}


