import { Sequelize } from 'sequelize';
import TwitterEmbed from './models/twitter_embed';
import MastodonStatus from './models/mastodon_status';
import CacheFetch from './models/fetch';

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: './cache.sqlite',
  logging: false,   
});

[
  TwitterEmbed,
  MastodonStatus,
  CacheFetch
].forEach(({model, attributes, modelName}) => {
  model.init(attributes, { sequelize, modelName });
})

// await sequelize.sync({ force: true }); // drops tables
// await sequelize.sync({ alter: true }); // updates tables
await sequelize.sync();