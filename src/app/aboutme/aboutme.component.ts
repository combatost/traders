import { trigger, state, style, transition, animate } from '@angular/animations';
import { Component } from '@angular/core';
import { Router } from '@angular/router';  // Import Router

@Component({
  selector: 'app-aboutme',
  templateUrl: './aboutme.component.html',
  styleUrls: ['./aboutme.component.sass'],
  animations: [
    trigger('fadeInOut', [
      state('in', style({ opacity: 1 })),
      transition('void => *', [
        style({ opacity: 0 }),
        animate(300)  // Adjust the duration (in milliseconds)
      ]),
      transition('out => void', [
        animate(300, style({ opacity: 1 }))  // Adjust the duration (in milliseconds)
      ])
    ])
  ]
})
export class AboutmeComponent {
  stats = [
    { icon: 'rocket_launch', title: 'Fast Deployments', description: 'Live in minutes, scale in hours.' },
    { icon: 'verified_user', title: 'Secure Systems', description: 'Your data is protected with bank-grade encryption.' },
    { icon: 'support_agent', title: '24/7 Support', description: 'We’ve always got your back.' },
    { icon: 'insights', title: 'AI-Driven Insights', description: 'Smarter decisions with every click.' }
  ];

  team = [
    { name: 'Ayman', role: 'Founder & Visionary', photo: 'assets/team/ayman.jpg' },
    { name: 'Sara', role: 'UI/UX Designer', photo: 'assets/team/sara.jpg' },
    { name: 'Ziad', role: 'Full Stack Developer', photo: 'assets/team/ziad.jpg' },
    { name: 'Layla', role: 'Marketing Head', photo: 'assets/team/layla.jpg' }
  ];
  isChatVisible = false;
  messages = [
    { text: 'Hello, how can I assist you today?', fromUser: false }
  ];
  userMessage = '';

  toggleChat() {
    this.isChatVisible = !this.isChatVisible;
  }

  sendMessage() {
    if (this.userMessage.trim()) {
      this.messages.push({ text: this.userMessage, fromUser: true });
      this.userMessage = '';

      setTimeout(() => {
        this.messages.push({ text: 'I am your friendly bot. How can I help?', fromUser: false });
      }, 1000);
    }
  }
  hideContent = false;
  constructor(private router: Router) {} // Inject Router

  toggleVisibility() {
    this.hideContent = !this.hideContent;
  }

  navigateToAbout(): void {
    this.router.navigate(['aboutme']);  // Navigate to AboutMe component
  }
}
