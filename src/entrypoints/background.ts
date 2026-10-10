import { browser } from 'wxt/browser';
import { initializeSettings } from '../shared/storage';

export default defineBackground(() => {
  browser.runtime.onInstalled.addListener(() => {
    void initializeSettings();
  });
});
