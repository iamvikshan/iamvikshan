let youtube, twitter, twitch;

updatePage();

document.addEventListener('load', async () => {});

async function updatePage() {
  youtube = await getYoutubeData();
  twitter = await getTwitterData();
  twitch = await getTwitchData();
  twitchlive = await isTwitchLive();

  updateYoutube(youtube);
  updateTwitter(twitter);
  updateTwitch(twitch);
  updateTwitchLive(twitchlive);
}

async function getYoutubeData() {
  let data = JSON.parse(localStorage.getItem('youtube'));
  if (data == null || data.time < Date.now()) {
    let youtube = await fetch('api/youtube');
    data = await youtube.json();
    localStorage.setItem('youtube', JSON.stringify(data));
  }
  return data;
}

async function getTwitterData() {
  let data = JSON.parse(localStorage.getItem('twitter'));
  if (data == null || data.time < Date.now()) {
    let twitter = await fetch('api/twitter');
    data = await twitter.json();
    localStorage.setItem('twitter', JSON.stringify(data));
  }
  return data;
}

async function getTwitchData() {
  let data = JSON.parse(localStorage.getItem('twitch'));
  if (data == null || data.time < Date.now()) {
    let twitch = await fetch('api/twitch');
    data = await twitch.json();
    localStorage.setItem('twitch', JSON.stringify(data));
  }
  return data;
}

async function isTwitchLive() {
  let data = JSON.parse(localStorage.getItem('twitchlive'));
  if (data == null || data.time < Date.now()) {
    let twitch = await fetch('api/twitch/islive');
    data = await twitch.json();
    localStorage.setItem('twitchlive', JSON.stringify(data));
  }
  return data;
}

function updateYoutube(data) {
  let youtube_subs = document.getElementById('youtube_subs');
  youtube_subs.innerText = data.channel.subscribersText;
  youtube_subs.classList.toggle('skeleton');
  document.getElementById('yt_placeholder').src = data.video.thumbnail;
  document.getElementById('youtube_viewcount').innerText = data.video.viewsText;
  document.getElementById('youtube_stamp').innerText = data.video.publishedText;
}

function updateTwitter(data) {
  let twitter_subs = document.getElementById('twitter_subs');
  twitter_subs.innerText = data.followersText;
  twitter_subs.classList.toggle('skeleton');
}

function updateTwitch(data) {
  let twitch_subs = document.getElementById('twitch_subs');
  twitch_subs.innerText = data.followersText;
  twitch_subs.classList.toggle('skeleton');
}

function updateTwitchLive(data) {
  let twitchcard = document.getElementById('twitchcard');
  let twitch_subs = document.getElementById('twitch_subs');
  if (data.islive) {
    twitchcard.classList.add('islive');
    twitch_subs.innerText = data.viewers + ' Live Viewers';
    document.getElementById('twitchlive').innerText = '🔴 Watch Stream';
  } else {
    twitchcard.classList.remove('islive');
  }
}

document.getElementById('youtube_placeholder').onclick = function () {
  document.getElementById('youtube_placeholder').style = 'display: none';
  document.getElementById('youtube_embed').style = 'display: block';
  document.getElementById('youtube_embed').src =
    `https://www.youtube.com/embed/${youtube.video.id}?autoplay=1`;
};
