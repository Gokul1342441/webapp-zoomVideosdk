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
  public audioDecode : any ;
  public audioEncode : any ;
 
  @ViewChild('defaultModal') defaultModal!: ElementRef;

  sessionData: any = {
    sessionName: 'Fuck',
    role: 1,
    sessionKey: 'Fuck123',
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
      console.log(participants)
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
  }

  unmuteAudio(){
    this.stream.muteAudio()
    console.log("Mute",this.stream.muteAudio())
  }

  muteAudio(){
    this.stream.unmuteAudio()
    console.log("unMute",this.stream.unmuteAudio())
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
