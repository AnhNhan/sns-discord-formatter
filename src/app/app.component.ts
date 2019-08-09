import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import * as Url from 'url-parse';
import { Twitter } from 'twit';
import * as _ from 'lodash';

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
  public linkType: 'twitter' | 'tistory' | 'none' = 'none';

  public formatCreditScreenName = true;
  public formatCreditSiteOverText = false;
  public formatStripTags = true;
  public attemptTranslation = true;
  public useMachineTranslationOverHandbuilt = true;

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
    this.linkInputUpdate();
  }

  linkInputUpdate() {
    this.notRecognized = false;
    this.reset();
    this.output = '';

    const trimmedInput = this.linkInput.trim();
    const isTwitterTweetUrl = /^((\d{16,})|https:\/\/twitter.com\/[^/]+\/status\/\d+(\?s=\d+)?)$/;
    if (isTwitterTweetUrl.test(trimmedInput)) {
      this.linkType = 'twitter';
      const matches = trimmedInput.match(/^((\d+)|https:\/\/twitter.com\/[^/]+\/status\/(\d+)(?:\?s=\d+)?)$/);
      const tweetId = matches[2] || matches[3];
      return this.handleTwitterTweet(tweetId);
    }

    const isTistoryUrl = /^https?:\/\/(.*?)\/(m\/)?(\d+)$/;
    if (isTistoryUrl.test(trimmedInput)) {
      this.linkType = 'tistory';
      const matches = trimmedInput.match(isTistoryUrl);
      return this.handleTistory(matches[1], matches[3]);
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
    this.linkType = 'none';
  }

  handleTistory(account: string, id: string) {
    const endpoint = `${this.apiBase}sns-proxy/tistory/${account}/${id}`;
    this.inProgress = true;
    this.$http.get(endpoint, {
      headers: {
        'x-api-key': this.apiKey,
      },
    }).toPromise().then((response: TistoryResponse) => {
      const data = response.data;
      const tweetUrl = data.publicUrl || `https://${account}.tistory.com/${id}`;
      this.authorName = this.formatCreditSiteOverText ? tweetUrl : data.pageName;
      this.tweetText = this.attemptTranslation && this.useMachineTranslationOverHandbuilt ? data.translatedTitle : data.title;
      this.tweetUrl = this.formatCreditSiteOverText ? '' : tweetUrl;

      this.mediaLinks = data.images;
      this.urls = data.media.map(media => `${media.type}: ${media.uri}`);

      this.handMadeTranslation();

      this.output = this.renderTweet();

      this.inProgress = false;
    });
  }

  handleTwitterTweet(tweetId: string) {
    const endpoint = `${this.apiBase}sns-proxy/twitter/status/${tweetId}`;
    this.inProgress = true;
    this.$http.get(endpoint, {
      headers: {
        'x-api-key': this.apiKey,
      },
    }).toPromise().then((response: {
      data: Twitter.Status & {
        extended_entities?: {
          media?: Twitter.MediaEntity[];
        };
        translated_text?: string;
      }
    }) => {
      const tweet = response.data;
      if (tweet.truncated) {
        this.truncated = true;
        this.inProgress = false;
        return;
      }
      this.authorName = this.formatCreditScreenName ? tweet.user.screen_name : tweet.user.name;
      const statusText = this.attemptTranslation && this.useMachineTranslationOverHandbuilt ?
        tweet.translated_text || tweet.text : tweet.text;
      this.tweetText = (this.formatCreditSiteOverText ? 'Twitter' : statusText)
        .replace(/https:\/\/t\.co\/\w+/g, '');
      if (this.formatStripTags) {
        this.tweetText = this.tweetText.replace(/[#@].+?( |\b)/g, ' ');
      }
      this.handMadeTranslation();
      this.tweetText = this.tweetText.replace(/[ \n]+/g, ' ').trim();
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

  private handMadeTranslation() {
    if (this.attemptTranslation && !this.useMachineTranslationOverHandbuilt) {
      // tslint:disable-next-line: no-use-before-declare
      _.forOwn(translationPhrases,
        (translated, original) => this.tweetText = this.tweetText.replace(new RegExp(original, 'g'), ' ' + translated + ' '));
    }
  }

  addOrigLink(url: string) {
    if (/^https:\/\/pbs\.twimg\.com\/media\/.*?\.jpg$/.test(url)) {
      return url + '?name=orig'; // I'm lazy zzz
    }

    return url;
  }

  resolveDaumCdn(url: string) {
    if (/^https:\/\/img1\.daumcdn\.net\/thumb\//.test(url)) {
      console.log(new Url(url, true));
      return new Url(url, true).query.fname;
    }

    return url;
  }

  renderTweet() {
    return `\`${this.tweetText} cr. ${this.linkType === 'tistory' &&
      this.formatCreditSiteOverText ? '' : '@'}${this.authorName}\` ${this.tweetUrl ? '<' + this.tweetUrl + '>' : ''}
${_.chunk(this.mediaLinks, this.linkType === 'tistory' ? 2 : 4).map(chunk => chunk.concat([ '\n' ]).join('\n')).join('\n')}
${this.urls.join('\n')}`;
  }
}

interface TistoryResponse {
  type: 'tistory';
  data: {
    pageName: string;
    authorName: string;
    title: string;
    translatedTitle: string;
    translatedSourceLanguageCode: string;
    translatedTargetLanguageCode: string;
    url: string;
    publicUrl: string;
    isProtected: boolean;
    pageText: string;
    images: string[];
    media: {
      type: string;
      uri: string;
    }[];
  };
}

declare global {
  interface HTMLElement {
    createTextRange(): TextRange;
  }

  interface TextRange {
    moveToElementText(element: HTMLElement): void;
    select(): void;
  }
}

const translationPhrases = {
  김포: 'Gimpo airport',
  인천: 'Incheon airport',
  입국: 'arrival',
  출국: 'departure',
  프리뷰: 'preview',
  코엑스: 'COEX',
  더팩트: 'The Fact',
  레카: 'red carpet', // shorthand
  콘서트: 'concert',
  음악회: 'concert',
  평화이음: 'peace',
  경상: 'Gyeongsang',
  청라: 'Cheongla',
  오랜만이야: 'It\'s been a long time',
  도쿄콘: 'Tokyo Con',
  도쿄: 'Tokyo',
  뮤직: 'music',
  어워즈: 'awards',
  뮤뱅: 'Music Bank',
};
