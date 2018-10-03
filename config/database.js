if(process.env.NODE_ENV === 'production') {
  module.exports = {
    mongoURI: 'mongodb://wpittman:Element7430@ds255262.mlab.com:55262/mts-rest'
  }
} else {
  module.exports = {
    mongoURI: 'mongodb://localhost/mts-rest-dev'
  }
}