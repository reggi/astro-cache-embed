import Component from "./Tweet.astro";
export { Component };
import { guard, pluginEdit } from './plugin';
export * from './plugin';

export function custom (options: Parameters<typeof pluginEdit>[0]) {
  return {Component, guard, plugin: pluginEdit(options)};
}

