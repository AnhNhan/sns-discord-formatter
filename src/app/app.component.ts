import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'sns-discord-formatter';

  public inProgress = false;

  public linkInput: string;

  public notRecognized = false;

  public output = 'Example output...';

  constructor(
    private $http: HttpClient,
  ) {}

  linkInputUpdate(event: string) {
    this.notRecognized = false;
    this.output = '';

    const trimmedInput = this.linkInput.trim();
    const isTwitterTweetUrl = /^https:\/\/twitter.com\/[^/]+\/status\/\d+(\?s=\d+)?$/;
    if (isTwitterTweetUrl.test(trimmedInput)) {
      return this.handleTwitter(trimmedInput);
    }

    // no further handlers
    if (trimmedInput.length !== 0) {
      this.notRecognized = true;
    }
    this.output = 'Example output...';
  }

  handleTwitter(url: string) {
    const normalizedUrl = url.replace(/(\?s=\d+|\s+)+$/, '');
    this.inProgress = true;
    this.$http.get(normalizedUrl, {
      responseType: 'text',
    }).subscribe(response => {
      this.inProgress = false;
      console.log(response);
    });
  }
}
