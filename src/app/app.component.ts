import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import * as Url from 'url-parse';
import { Twitter } from 'twit';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'sns-discord-formatter';

  private apiBase = 'https://sns-services.anhnhan.de/api/';
  // todo find a better way to store this - not that it's too critical
  private apiKey = 'dUlcXwSVBZjeUQa97U234KXtHxTENkF9dYwMRBI9';

  public inProgress = false;

  public linkInput: string;

  public formatCreditScreenName = false;
  public formatCreditSiteOverText = false;

  public notRecognized = false;

  public output = 'Example output...';

  public guessDate: string;
  public tweetText: string;
  public tweetUrl: string;
  public authorName: string;
  public mediaLinks: string[] = [];
  public urls: string[] = [];
  public truncated = false;

  constructor(
    private $http: HttpClient,
  ) { }

  onInit() {
    this.linkInputUpdate(this.linkInput);
  }

  linkInputUpdate(event: string) {
    this.notRecognized = false;
    this.reset();
    this.output = '';

    const trimmedInput = this.linkInput.trim();
    const isTwitterTweetUrl = /^((\d{16,})|https:\/\/twitter.com\/[^/]+\/status\/\d+(\?s=\d+)?)$/;
    if (isTwitterTweetUrl.test(trimmedInput)) {
      const matches = trimmedInput.match(/^((\d+)|https:\/\/twitter.com\/[^/]+\/status\/(\d+)(?:\?s=\d+)?)$/);
      const tweetId = matches[2] || matches[3];
      return this.handleTwitterTweet(tweetId);
    }

    // no further handlers
    if (trimmedInput.length !== 0) {
      this.notRecognized = true;
    }
    this.reset();
  }

  copy() {
    this.selectText('output-container');
    document.execCommand('copy');
  }

  selectText(nodeId: string) {
    const node = document.getElementById(nodeId);

    if (typeof document.body.createTextRange === 'function') {
        const range = document.body.createTextRange();
        range.moveToElementText(node);
        range.select();
    } else if (window.getSelection) {
        const selection = window.getSelection();
        const range = document.createRange();
        range.selectNodeContents(node);
        selection.removeAllRanges();
        selection.addRange(range);
    } else {
        console.warn('Could not select text in node: Unsupported browser.');
    }
}

  reset() {
    this.output = 'Example output...';
    this.guessDate = undefined;
    this.tweetText = undefined;
    this.tweetUrl = undefined;
    this.authorName = undefined;
    this.mediaLinks = [];
    this.urls = [];
    this.truncated = false;
  }

  handleTwitterTweet(tweetId: string) {
    const endpoint = `${this.apiBase}sns-proxy/twitter/status/${tweetId}`;
    this.inProgress = true;
    this.$http.get(endpoint, {
      headers: {
        'x-api-key': this.apiKey,
      },
    }).subscribe((response: {
      data: Twitter.Status & {
        extended_entities?: {
          media?: Twitter.MediaEntity[];
        }
      }
    }) => {
      const tweet = response.data;
      if (tweet.truncated) {
        this.truncated = true;
        this.inProgress = false;
        return;
      }
      this.authorName = this.formatCreditScreenName ? tweet.user.screen_name : tweet.user.name;
      this.tweetText = (this.formatCreditSiteOverText ? 'Twitter' : tweet.text)
        .replace(/https:\/\/t\.co\/\w+/g, '')
        .replace(/(\s)+/gm, ' ')
        .trim()
        ;
      this.tweetUrl = `https://twitter.com/${tweet.user.screen_name}/status/${tweet.id_str}`;
      if (tweet.extended_entities) {
        this.mediaLinks = tweet.extended_entities.media
          .map((media: { type: string; expanded_url: any; media_url_https: any; }) =>
            media.type === 'video' || media.type === 'animated_gif' ? media.expanded_url : media.media_url_https)
          .map(this.addOrigLink)
        ;
      }
      this.urls = tweet.entities.urls
        .map((url: any) => url.expanded_url)
        .map(this.resolveDaumCdn)
      ;

      this.output = this.renderTweet();

      this.inProgress = false;
    });
  }

  addOrigLink(url) {
    if (/^https:\/\/pbs\.twimg\.com\/media\/.*?\.jpg$/.test(url)) {
      return url + '?name=orig'; // I'm lazy zzz
    }

    return url;
  }

  resolveDaumCdn(url) {
    if (/^https:\/\/img1\.daumcdn\.net\/thumb\//.test(url)) {
      console.log(new Url(url, true));
      return new Url(url, true).query.fname;
    }

    return url;
  }

  renderTweet() {
    return `\`${this.tweetText}\`
cr. @${this.authorName} <${this.tweetUrl}>
${this.mediaLinks.join('\n')}
${this.urls.join('\n')}`;
  }
}

declare global {
  interface HTMLElement {
    createTextRange(): TextRange;
  }

  interface TextRange {
    moveToElementText(element: HTMLElement);
    select();
  }
}
