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
  public sessionContainer: any;
  public audioDecode: any;
  public audioEncode: any;
  public loaderSpinner: boolean = false;
  @ViewChild('defaultModal') defaultModal!: ElementRef;

  // sessionData: any = {
  //   sessionName: 'thisIsNewSession',
  //   // sessionKey: 'thisIsNewSession123',
  //   userIdentity: '',
  // };

  sessionData: { sessionName: string; role: number, sessionKey: string; userIdentity: string } = {
    sessionName: 'be108a53-3f99-4f9f-a6fd-3dacf1133bb8',
    role: 1,
    sessionKey: '967716d5-e811-4f11-96f7-4e89adb6b574',
    userIdentity: '',
  };


  constructor(private httpClient: HttpClient, @Inject(DOCUMENT) document: any) { }

  ngOnInit() {
    const $targetEl = document.getElementById('default-modal');
    this.modal = new Modal($targetEl);
    this.modal.show();

    this.client.init('en-US', 'Global', { patchJsMedia: true, enforceMultipleVideos: true, enforceVirtualBackground:true, stayAwake:true, leaveOnPageUnload:true }).then(() => {
      console.log("init")
    })

    this.client.on('peer-video-state-change', (payload) => {
      let participants = this.client.getAllUser()
      console.log(participants)
      if (payload.action === 'Start') {
        this.stream.renderVideo(
          document.querySelector('#participant-videos-canvas'),
          participants[1].userId, 960, 540, 0, 540, 2)
        this.stream.renderVideo(
          document.querySelector('#participant-videos-canvas'),
          participants[2].userId, 960, 540, 960, 540, 2)
        this.stream.renderVideo(
          document.querySelector('#participant-videos-canvas'),
          participants[3].userId, 960, 540, 0, 0, 2)
        this.stream.renderVideo(
          document.querySelector('#participant-videos-canvas'),
          participants[4].userId, 960, 540, 960, 0, 2)
      } else if (payload.action === 'Stop') {
        this.stream.stopRenderVideo(
          document.querySelector('#participant-videos-canvas'),
          participants[1].userId
        )
        this.stream.stopRenderVideo(
          document.querySelector('#participant-videos-canvas'),
          participants[2].userId
        )
        this.stream.stopRenderVideo(
          document.querySelector('#participant-videos-canvas'),
          participants[3].userId
        )
        this.stream.stopRenderVideo(
          document.querySelector('#participant-videos-canvas'),
          participants[4].userId
        )
      }
    })

    this.client.on('media-sdk-change', (payload) => {
      console.log("media-sdk-change <----> payload", payload)
      if (payload.type === 'audio' && payload.result === 'success') {
        if (payload.action === 'encode') {
          this.audioEncode = true
        } else if (payload.action === 'decode') {
          this.audioDecode = true
        }
      }
    })

    this.client.on('video-active-change', (payload) => {
      console.log('Active speaker, use for any video adjustments', payload) // new active speaker, for example, use for video rendering changes, size changes, depending on your use case.
    })
  }

  public startMeeting() {
    this.loaderSpinner = true;
    console.log(this.loaderSpinner = true, "this.loaderSpinner = true")
    this.sessionContainer = document.getElementById('sessionContainer')
    this.getAuthSignature().then((d: any) => {
      const { sessionName, userIdentity } = this.sessionData;
      this.client
        .join(sessionName, d, userIdentity)
        .then(() => {
          console.log("joined")
          this.stream = this.client.getMediaStream();
          this.stream.startAudio();
          if (this.stream.isRenderSelfViewWithVideoElement()) {
            this.stream
              .startVideo({ videoElement: document.querySelector('#main-video') })
              .then(() => {
                this.loaderSpinner = false;
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
