import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ReturnStatement } from '@angular/compiler';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'sns-discord-formatter';

  private apiBase = '//localhost:3000';

  public inProgress = false;

  public linkInput: string = 'https://twitter.com/JYPETWICE/status/1120341497742626816';

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
    const url = `${this.apiBase}/statuses/show/${tweetId}`;
    this.inProgress = true;
    this.$http.get(url).subscribe((tweet: any) => {
      if (tweet.truncated) {
        this.truncated = true;
        this.inProgress = false;
        return;
      }
      this.authorName = tweet.user.name;
      this.tweetText = (tweet.text as string)
        .replace(/https:\/\/t\.co\/\w+/g, '')
        .replace(/(\s)+/gm, ' ')
        .trim()
        ;
      this.tweetUrl = `https://twitter.com/${tweet.user.screen_name}/status/${tweet.id_str}`;
      if (tweet.extended_entities) {
        this.mediaLinks = tweet.extended_entities.media
          .map((media: { type: string; expanded_url: any; media_url_https: any; }) =>
            media.type === 'video' || media.type === 'animated_gif' ? media.expanded_url : media.media_url_https);
      }
      this.urls = tweet.entities.urls.map((url: any) => url.expanded_url);

      this.output = this.renderTweet();

      this.inProgress = false;
    });
  }

  renderTweet() {
    return `\`${this.tweetText}\`
cr. @${this.authorName} <${this.tweetUrl}>
${this.mediaLinks.join('\n')}
${this.urls.join('\n')}`;
  }
}
