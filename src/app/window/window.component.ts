import { Component, OnInit, HostListener } from '@angular/core';
import { Router } from '@angular/router';
import { VideoService } from '../services/environment/video.service';

@Component({
  selector: 'app-window',
  templateUrl: './window.component.html',
  styleUrls: ['./window.component.sass'],
})
export class WindowComponent implements OnInit {
  videoUrl = 'assets/background.mp4'; // fallback
  isLoading = false;

  particlesOptions: any = {
    background: { color: { value: 'transparent' } },
    fpsLimit: 60,
    interactivity: {
      events: {
        onHover: { enable: true, mode: 'repulse' },
        resize: true,
      },
      modes: {
        repulse: { distance: 100, duration: 0.4 },
      },
    },
    particles: {
      color: { value: '#00fff7' },
      links: {
        color: '#00fff7',
        distance: 150,
        enable: true,
        opacity: 0.4,
        width: 1,
      },
      collisions: { enable: true },
      move: {
        direction: 'none',
        enable: true,
        outModes: { default: 'bounce' },
        random: false,
        speed: 1,
        straight: false,
      },
      number: { density: { enable: true, area: 800 }, value: 50 },
      opacity: { value: 0.5 },
      shape: { type: 'circle' },
      size: { value: { min: 1, max: 3 } },
    },
    detectRetina: true,
  };

  constructor(private router: Router, private videoService: VideoService) {}

  ngOnInit(): void {
    this.videoService.getFuturisticVideo().subscribe({
      next: (res) => {
        const firstVideo = res.videos?.[0]?.video_files?.find(
          (file: any) => file.quality === 'hd' || file.quality === 'sd'
        );
        if (firstVideo) {
          this.videoUrl = firstVideo.link;
          console.log('Loaded video URL:', this.videoUrl);
        }
      },
      error: (err) => {
        console.warn('Video API error, fallback video used', err);
      },
    });
  }

  startOrder(): void {
    if (this.isLoading) return;
    this.isLoading = true;

    setTimeout(() => {
      this.router.navigate(['/sheintable']);
    }, 1200);
  }

  @HostListener('document:keydown.enter', ['$event'])
  handleEnter(event: KeyboardEvent) {
    this.startOrder();
  }
}
