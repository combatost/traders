import { trigger, state, style, transition, animate } from '@angular/animations';
import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { Router } from '@angular/router';
import { VideoService } from '../services/environment/video.service';

interface Stat {
  icon: string;
  title: string;
  description: string;
}

interface TeamMember {
  name: string;
  role: string;
  photo: string;
}

@Component({
  selector: 'app-aboutme',
  templateUrl: './aboutme.component.html',
  styleUrls: ['./aboutme.component.sass'],
  animations: [
    trigger('fadeInOut', [
      state('in', style({ opacity: 1 })),
      transition('void => *', [
        style({ opacity: 0 }),
        animate(300)
      ]),
      transition('* => void', [
        animate(300, style({ opacity: 0 }))
      ])
    ])
    
  ]
})
export class AboutmeComponent implements OnInit {

  @ViewChild('bgVideo') bgVideo!: ElementRef<HTMLVideoElement>;

  private _videoUrl: string | null = null;

  readonly stats: Stat[] = [
    { icon: 'rocket_launch', title: 'Fast Deployments', description: 'Live in minutes, scale in hours.' },
    { icon: 'verified_user', title: 'Secure Systems', description: 'Your data is protected with bank-grade encryption.' },
    { icon: 'support_agent', title: '24/7 Support', description: 'We’ve always got your back.' },
    { icon: 'insights', title: 'AI-Driven Insights', description: 'Smarter decisions with every click.' }
  ];

  readonly team: TeamMember[] = [
    { name: 'Ali Amhaz', role: 'Main Owner', photo: 'assets/image/user-icon.png' },
    { name: 'Sara', role: 'UI/UX Designer', photo: 'assets/image/user-icon.png' },
    { name: 'Ziad', role: 'Full Stack Developer', photo: 'assets/image/user-icon.png' },
    { name: 'Layla', role: 'Marketing Head', photo: 'assets/image/user-icon.png' }
  ];

  isVideoPlaying = true;

  constructor(
    private readonly router: Router,
    private readonly videoService: VideoService
  ) {}

  ngOnInit(): void {
    this.loadFuturisticVideo();
  }

  get videoUrl(): string | null {
    return this._videoUrl;
  }

  private loadFuturisticVideo(): void {
    this.videoService.getFuturisticVideo().subscribe({
      next: (response) => {
        const video = response.videos?.[0];
        if (!video) {
          console.warn('No videos found in response');
          this._videoUrl = null;
          return;
        }

        const mp4Video = video.video_files.find((file: any) =>
          file.file_type === 'video/mp4' && file.quality === 'sd'
        );

        this._videoUrl = mp4Video?.link || video.video_files?.[0]?.link || null;
      },
      error: (err) => {
        console.error('Failed to load video from API', err);
        this._videoUrl = null;
      }
    });
  }

  toggleVideoPlay(): void {
    if (!this.bgVideo) return;
    const videoEl = this.bgVideo.nativeElement;

    if (videoEl.paused) {
      videoEl.play();
      this.isVideoPlaying = true;
    } else {
      videoEl.pause();
      this.isVideoPlaying = false;
    }
  }
}
