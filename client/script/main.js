const { Realtime, TextMessage } = AV;

const App = new Vue({
  el: '#app',
  template: '#template',
  data: {
    socket: null,
    player: null,
    hls: null,
    goEasyConnect: null,
    videoList: [],
    videoSrc: 'https://d2zihajmogu5jn.cloudfront.net/bipbop-advanced/bipbop_16x9_variant.m3u8',
    playing: false,
    controlParam: {
      user: '',
      action: '',
      time: '',
    },
    userId: '',
  },
  methods: {
    randomString(length) {
      let str = '';
      for (let i = 0; i < length; i++) {
        str += Math.random().toString(36).substr(2);
      }
      return str.substr(0, length);
    },
    addVideo() {
      if (this.videoSrc) {
        this.videoList.push(decodeURI(this.videoSrc));
      }
      localStorage.setItem('videoList', JSON.stringify(this.videoList));
    },
    playVideoItem(src) {
      if (src.includes('.m3u8')) {
        this.hls.loadSource(src);
        this.hls.attachMedia(this.player);
      } else {
        this.$refs.video.src = src;
      }
      localStorage.setItem('currentPlayVideo', src);
    },
    deleteVideoItem(index) {
      this.videoList.splice(index, 1);
      localStorage.setItem('videoList', JSON.stringify(this.videoList));
    },
    toggleFullScreen() {
      if (this.player.requestFullscreen) {
        this.player.requestFullscreen();
      } else if (this.player.mozRequestFullScreen) {
        this.player.mozRequestFullScreen();
      } else if (this.player.webkitRequestFullscreen) {
        this.player.webkitRequestFullscreen();
      } else if (this.player.msRequestFullscreen) {
        this.player.msRequestFullscreen();
      }
    },
    playVideo() {
      if (this.playing) {
        this.player.pause();
        this.controlParam.action = 'pause';
        this.controlParam.time = this.player.currentTime;
        this.sendMessage(this.controlParam);
      } else {
        this.player.play();
        this.controlParam.action = 'play';
        this.controlParam.time = this.player.currentTime;
        this.sendMessage(this.controlParam);
      }
    },
    seekVideo() {
      this.controlParam.action = 'seek';
      this.controlParam.time = this.player.currentTime;
      this.sendMessage(this.controlParam);
    },
    sendMessage(controlParam) {
      const params = JSON.stringify(controlParam);
      this.socket.emit('video-control', params);
    },
    resultHandler(result) {
      switch (result.action) {
        case 'play':
          this.player.currentTime = (result.time + 0.2);
          this.player.play();
          break;
        case 'pause':
          this.player.currentTime = result.time;
          this.player.pause();
          break;
        case 'seek':
          this.player.currentTime = result.time;
          break;
      }
    },
    getParam(variable) {
      const query = window.location.search.substring(1);
      const vars = query.split('&');
      for (let i = 0; i < vars.length; i++) {
        const pair = vars[i].split('=');
        if (pair[0] === variable) {
          return pair[1];
        }
      }
      return false;
    },
    setParam(param, val) {
      const stateObject = 0;
      const title = '0';
      const oUrl = window.location.href.toString();
      let nUrl = '';
      const pattern = new RegExp(param + '=([^&]*)');
      const replaceText = param + '=' + val;
      if (oUrl.match(pattern)) {
        nUrl = oUrl.replace(pattern, replaceText);
      } else {
        nUrl = oUrl.includes('?') ? `${oUrl}&${replaceText}` : `${oUrl}?${replaceText}`;
      }
      history.replaceState(stateObject, title, nUrl);
    }
  },
  created() {
    const localList = JSON.parse(localStorage.getItem('videoList'));
    this.videoList = localList || [];
    const currentPlayVideo = localStorage.getItem('currentPlayVideo');
    if (currentPlayVideo) {
      this.videoSrc = currentPlayVideo;
    }
    if (this.getParam("url")) {
      this.videoSrc = decodeURIComponent(this.getParam("url"));
    }
    this.userId = this.randomString(10);
    this.controlParam.user = this.userId;
  },
  mounted() {
    this.player = this.$refs.video;
    if (Hls.isSupported()) {
      this.hls = new Hls();
      this.hls.loadSource(this.videoSrc);
      this.hls.attachMedia(this.player);
    }

    this.socket = io('http:websocket.lifelikelemon.top:2233');
    this.socket.on('video-control', (res) => {
      const result = JSON.parse(res);
      if (result.user !== this.userId) {
        this.resultHandler(result);
      }
    });

    this.player.addEventListener('play', () => {
      this.playing = true;
    });
    this.player.addEventListener('pause', () => {
      this.playing = false;
    });
  }
});
