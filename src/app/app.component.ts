import { Component, ViewChild, ElementRef, Inject } from '@angular/core';
import { OnInit } from '@angular/core';
import { initFlowbite, Modal } from 'flowbite';
import { HttpClient } from '@angular/common/http';
import ZoomVideo from '@zoom/videosdk';
import { DOCUMENT } from '@angular/common';
import uitoolkit from '@zoom/videosdk-ui-toolkit'
// import '@zoom/videosdk-ui-toolkit/dist/videosdk-ui-toolkit.css'

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit {
  public title = 'webapp-zoomVideosdk';
  public modal !: Modal;
  public client = ZoomVideo.createClient()
  public stream: any;
  public sessionContainer : any;

  @ViewChild('defaultModal') defaultModal!: ElementRef;

  sessionData: any = {
    sessionName: 'Cool Cars',
    role: 1,
    sessionKey: 'session123',
    userIdentity: '',
    features: ['video', 'audio', 'settings', 'users', 'chat', 'share']
  };


  constructor(private httpClient: HttpClient, @Inject(DOCUMENT) document: any) { }

  ngOnInit() {
    const $targetEl = document.getElementById('default-modal');
    this.modal = new Modal($targetEl);
    this.modal.show();

    this.client.init('en-US', 'Global', { patchJsMedia: true, enforceMultipleVideos: true }).then(() => {
      console.log("init")
    })

    this.client.on('peer-video-state-change', (payload) => {
      console.log("🚀 ~ AppComponent ~ this.client.on ~ payload:", payload)
      let participants = this.client.getAllUser()
      if (payload.action === 'Start') {
        // this.stream.renderVideo(
        //   document.querySelector('#participant-videos-canvas'),
        //   payload.userId, 1920, 1080, 0, 0, 3)
        this.stream.renderVideo(
          document.querySelector('#participant-videos-canvas'),
          participants[0].userId, 960, 540, 0, 540, 2)
        this.stream.renderVideo(
          document.querySelector('#participant-videos-canvas'),
          participants[1].userId, 960, 540, 960, 540, 2)
        this.stream.renderVideo(
          document.querySelector('#participant-videos-canvas'),
          participants[2].userId, 960, 540, 0, 0, 2)
        this.stream.renderVideo(
          document.querySelector('#participant-videos-canvas'),
          participants[3].userId, 960, 540, 960, 0, 2)
      } else if (payload.action === 'Stop') {
        // this.stream.stopRenderVideo(
        //   document.querySelector('#participant-videos-canvas'),
        //   payload.userId
        // )
      }
    })
  }

  joinSession() {
    uitoolkit.joinSession(this.sessionContainer, this.sessionData)

    uitoolkit.onSessionClosed(this.sessionClosed)
  }

  sessionClosed = (() => {
    console.log('session closed')
    uitoolkit.closeSession(this.sessionContainer)
  })

  public startMeeting() {
    this.sessionContainer = document.getElementById('sessionContainer')
    // api to get signature
    this.getAuthSignature().then((d: any) => {
      const { sessionName, userIdentity } = this.sessionData;
      this.client
        .join(sessionName, d, userIdentity)
        .then(() => {
          console.log("joined")
          this.stream = this.client.getMediaStream();
          if (this.stream.isRenderSelfViewWithVideoElement()) {
            this.stream
              .startVideo({ videoElement: document.querySelector('#main-video') })
              .then(() => {
                // thie
                // Video successfully started and rendered
                console.log("Video started successfully");
                //it will add white border when video starts 
                // $('main-video').css({
                //   'border': '2px solid white'
                // });
                // stream.startAudio();
                this.stream.startAudio()
                this.client.on('user-added', (payload) => {
                  console.log("🚀 ~ AppComponent ~ this.client.on ~ payload:", payload)
                  console.log(payload[0].userId + ' joined the session');
                  // updateUserJoinedUI(payload[0].userId);
                });

                this.client.on('active-speaker', (payload) => {
                  console.log("🚀 ~ AppComponent ~ this.client.on ~ payload:", payload)
                  console.log('Active speaker, use for CSS visuals', payload);
                });

                // Resolve the promise when all Zoom SDK operations are completed
                // resolve({ this.client, this.stream });
                // video successfully started and rendered
              })
              .catch((error: any) => {
                console.log(error)
              })
          } else {
            this.stream
              .startVideo()
              .then(() => {
                this.stream
                  .renderVideo(
                    document.querySelector('#my-self-view-canvas'),
                    this.client.getCurrentUserInfo().userId, 1920, 1080, 0, 0, 3)
                  .then(() => {
                    // video successfully started and rendered
                  })
                  .catch((error: any) => {
                    console.log(error)
                  })
              })
              .catch((error: any) => {
                console.log(error)
              })
          }

        }).catch((e) => {
          console.log(e)
        })
    }).catch(e => {

    });

  }

  async getAuthSignature() {
    return new Promise((res, rej) => {
      this.httpClient.post("https://zoom-sdk-auth-nee73nz7oa-uk.a.run.app", {
        role: this.sessionData.role,
        sessionName: this.sessionData.sessionName,
        sessionKey: this.sessionData.sessionKey,
        userIdentity: this.sessionData.userIdentity
      }).subscribe((d: any) => {
        res(d.signature)
      }, (e) => {
        res(e)
      })
    })
  }
}
