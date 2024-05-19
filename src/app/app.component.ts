import { Component, ViewChild, ElementRef, Inject } from '@angular/core';
import { OnInit } from '@angular/core';
import { initFlowbite, Modal } from 'flowbite';
import { HttpClient } from '@angular/common/http';
import ZoomVideo from '@zoom/videosdk';
import { DOCUMENT, DatePipe } from '@angular/common';
import moment from 'moment-timezone';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit {
  @ViewChild('defaultModal') defaultModal!: ElementRef;
  public title = 'webapp-zoomVideosdk';
  public modal !: Modal;
  public client = ZoomVideo.createClient()
  public stream: any;
  public audioDecode: any;
  public audioEncode: any;
  public loaderSpinner: boolean = false;
  public Allcontainer: boolean = false;
  public audioMuted: boolean = true;
  public videoEnabled: boolean = true;
  public currentTime: string | null = null;


  sessionData: { sessionName: string; role: number, sessionKey: string; userIdentity: string } = {
    sessionName: '93c0482b-6cd1-44fc-bdf7-f7bd624a8f49',
    role: 1,
    sessionKey: '53c43e39-0f3f-47a9-afca-88af577b43ee',
    userIdentity: '',
  };


  constructor(private httpClient: HttpClient, @Inject(DOCUMENT) document: any) { }

  ngOnInit() {
    this.updateTime();
    setInterval(() => this.updateTime(), 60000);

    const $targetEl = document.getElementById('default-modal');
    this.modal = new Modal($targetEl);
    this.modal.show();

    this.client.init('en-US', 'Global', { patchJsMedia: true, enforceMultipleVideos: true, enforceVirtualBackground: true, stayAwake: true, leaveOnPageUnload: true }).then(() => {
      console.log("init")
    })

    this.client.on('peer-video-state-change', (payload) => {
      let participants = this.client.getAllUser()
      console.log("🚀 ~ AppComponent ~ this.client.on ~ participants:", participants)
      if (payload.action === 'Start') {
        this.stream.renderVideo(
          document.querySelector('#participant-videos-canvas'),
          payload.userId, 960, 540, 0, 0, 3)
      } else if (payload.action === 'Stop') {
        this.stream.stopRenderVideo(
          document.querySelector('#participant-videos-canvas'),
          payload.userId
        )
      }
    })

    this.client.on('media-sdk-change', (payload) => {
      if (payload.type === 'audio' && payload.result === 'success') {
        if (payload.action === 'encode') {
          this.audioEncode = true
        } else if (payload.action === 'decode') {
          this.audioDecode = true
        }
      }
    })

    this.client.on('active-speaker', (payload) => {
      console.log('Active speaker, use for CSS visuals', payload) // new active speaker, for example, use for microphone visuals, css video border, etc.
    })
  }

  updateTime() {
    const now = moment().tz('Asia/Kolkata');
    this.currentTime = now.format('hh:mm A');
  }


  public startMeeting() {
    this.loaderSpinner = true;
    this.getAuthSignature().then((d: any) => {
      const { sessionName, userIdentity } = this.sessionData;
      this.client
        .join(sessionName, d, userIdentity)
        .then(() => {
          this.stream = this.client.getMediaStream();
          this.stream.startAudio(
            {
              originalSound: {
                stereo: true,
                hifi: true
              }
            }
          );
          this.stream.enableOriginalSound({
            hifi: true,
            stereo: true
          })
          if (this.stream.isRenderSelfViewWithVideoElement()) {
            this.loaderSpinner = false;
            this.Allcontainer = true;
            this.stream
              .startVideo({ videoElement: document.querySelector('#main-video') })
              .then(() => {
              })
              .catch((error: any) => {
                console.log(error)
              })
          } else {
            this.stream
              .startVideo({ fullHd: true })
              .then(() => {
                this.loaderSpinner = false;
                this.Allcontainer = true;
                this.stream
                  .renderVideo(
                    document.querySelector('#my-self-view-canvas'),
                    this.client.getCurrentUserInfo().userId, 960, 540, 0, 0, 3)
                  .then(() => {
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

  toggleMic(): void {
    const userId = this.client.getCurrentUserInfo().userId;
    if (!this.audioMuted) {
      this.audioMuted = true;
      this.audioEncode = false;
      this.stream.unmuteAudio(userId)
    } else {
      this.audioMuted = false;
      this.audioEncode = true;
      this.stream.muteAudio(userId)
    }
  }

  toggleCamera(): void {
    const userId = this.client.getCurrentUserInfo().userId;
    if (!this.videoEnabled) {
      console.log("Enable")
      this.videoEnabled = true;
      this.stream
      .startVideo({ virtualBackground: { imageUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSGWw5y12t-U1F6RofF4WlpcAWZFL6G2Ua30PkxyxDsEA&s' } })
      .then(() => {
        this.stream.renderVideo(
          document.querySelector('#my-self-view-canvas'),
          userId, 960, 540, 0, 0, 3)
      })
    } else {
      console.log("Disable")
      this.videoEnabled = false;
      this.stream
      .stopVideo({ virtualBackground: { imageUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSGWw5y12t-U1F6RofF4WlpcAWZFL6G2Ua30PkxyxDsEA&s' } })
      .then(() => {
        this.stream.stopRenderVideo(
          document.querySelector('#my-self-view-canvas'),
          userId)
      })
    }

  }




  // =================================================================================================================================================================================================

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

  // async getAuthSignature() {
  //   return new Promise((res, rej) => {
  //     this.httpClient.post("http://localhost:8080/api/zoomsdk-token", {
  //       roomName: this.sessionData.sessionName,
  //       roomKey: this.sessionData.sessionKey,
  //       userName: this.sessionData.userIdentity
  //     }).subscribe((d: any) => {
  //       res(d.signature)
  //     }, (e) => {
  //       res(e)
  //     })
  //   })
  // }


  // async getAuthSignature() {
  //   return new Promise((resolve, reject) => {
  //     const url = `http://localhost:8080/api/zoomsdk-token?roomName=${encodeURIComponent(this.sessionData.sessionName)}&roomKey=${encodeURIComponent(this.sessionData.sessionKey)}&userName=${encodeURIComponent(this.sessionData.userIdentity)}`;

  //     this.httpClient.get(url).subscribe(
  //       (response: any) => {
  //         resolve(response.signature);
  //       },
  //       (error) => {
  //         reject(error);
  //       }
  //     );
  //   });
  // }


  // &roomKey=${encodeURIComponent(this.sessionData.sessionKey)}
}
