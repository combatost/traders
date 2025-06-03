import { trigger, state, style, transition, animate } from '@angular/animations';
import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { Router } from '@angular/router';
import { VideoService } from '../services/environment/video.service';

interface Stat {
  icon: string;
  titleKey: string;
  descriptionKey: string;
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
    { icon: 'shopping_cart', titleKey: 'aboutUs.stats.0.title', descriptionKey: 'aboutUs.stats.0.description' },
    { icon: 'speed', titleKey: 'aboutUs.stats.1.title', descriptionKey: 'aboutUs.stats.1.description' },
    { icon: 'devices', titleKey: 'aboutUs.stats.2.title', descriptionKey: 'aboutUs.stats.2.description' },
    { icon: 'support_agent', titleKey: 'aboutUs.stats.3.title', descriptionKey: 'aboutUs.stats.3.description' },
  ];


  readonly team: TeamMember[] = [
    { name: 'Ali Amhaz', role: 'Main Owner', photo: 'assets/image/ali.jpeg' },
    { name: 'Mhamad Wannos', role: 'Marketing Head', photo: 'assets/img/jakwar.jpeg' },
    { name: 'Ziad', role: 'Full Stack Developer', photo: 'assets/image/user-icon.png' },
    { name: 'Layla', role: 'UI/UX', photo: 'assets/image/user-icon.png' }
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
      const videos = response.videos || [];
      if (videos.length === 0) {
        console.warn('No videos found');
        this._videoUrl = null;
        return;
      }

      // Shuffle logic: pick a random video
      const randomIndex = Math.floor(Math.random() * videos.length);
      const video = videos[randomIndex];

      const mp4 = video.video_files.find(
        (file: any) => file.file_type === 'video/mp4' && file.quality === 'sd'
      );
      this._videoUrl = mp4?.link || video.video_files[0]?.link || null;
    },
    error: (err) => {
      console.error('Error loading video', err);
      this._videoUrl = null;
    }
  });
}


}
