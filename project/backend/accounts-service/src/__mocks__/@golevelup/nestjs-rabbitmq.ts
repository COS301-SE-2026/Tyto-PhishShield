module.exports = {
  AmqpConnection: jest.fn().mockImplementation(() => ({
    publish: jest.fn(),
    channel: { close: jest.fn() },
    close: jest.fn(),
  })),
  RabbitMQModule: {
    forRoot: () => ({ module: class {}, providers: [] }),
    forRootAsync: () => ({ module: class {}, providers: [] }),
  },
  RabbitSubscribe: () => jest.fn(),
  RabbitHandler: () => jest.fn(),
  Nack: jest.fn(),
};