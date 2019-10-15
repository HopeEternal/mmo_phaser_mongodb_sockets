class BootScene extends Phaser.Scene {
  constructor() {
    super({
      key: 'BootScene',
      active: true
    });
  }

  preload() {
    // map tiles
    this.load.image('tiles', 'assets/map/spritesheet-extruded.png');
    // map in json format
    this.load.tilemapTiledJSON('map', 'assets/map/map.json');
    // our two characters
    this.load.spritesheet('player', 'assets/RPG_assets.png', {
      frameWidth: 16,
      frameHeight: 16
    });
  }

  create() {
    this.socket = io();
    this.scene.start('WorldScene');
  }
}

class WorldScene extends Phaser.Scene {
  constructor() {
    super({
      key: 'WorldScene'
    });
  }

  create() {
    this.socket = io();
   
    // create map
    this.createMap();
   
    // create player animations
    this.createAnimations();
   
    // user input
    this.cursors = this.input.keyboard.createCursorKeys();
   
    // create enemies
    this.createEnemies();
   
    // listen for web socket events
    this.socket.on('currentPlayers', function (players) {
      Object.keys(players).forEach(function (id) {
        if (players[id].playerId === this.socket.id) {
          this.createPlayer(players[id]);
        } else {
          this.addOtherPlayers(players[id]);
        }
      }.bind(this));
    }.bind(this));
   
    this.socket.on('newPlayer', function (playerInfo) {
      this.addOtherPlayers(playerInfo);
    }.bind(this));
  }
  
  createPlayer() {
    // our player sprite created through the phycis system
    this.player = this.physics.add.sprite(50, 100, 'player', 6);
  
    // don't go out of the map
    this.player.setCollideWorldBounds(true);
  }
  
  updateCamera() {
    // limit camera to map
    this.cameras.main.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);
    this.cameras.main.startFollow(this.player);
    this.cameras.main.roundPixels = true; // avoid tile bleed
  }
  
  createEnemies() {
    // where the enemies will be
    this.spawns = this.physics.add.group({
      classType: Phaser.GameObjects.Zone
    });
    for (var i = 0; i < 30; i++) {
      var x = Phaser.Math.RND.between(0, this.physics.world.bounds.width);
      var y = Phaser.Math.RND.between(0, this.physics.world.bounds.height);
      // parameters are x, y, width, height
      this.spawns.create(x, y, 20, 20);
    }
    // add collider
    this.physics.add.overlap(this.player, this.spawns, this.onMeetEnemy, false, this);
  }

  onMeetEnemy(player, zone) {
    // we move the zone to some other location
    zone.x = Phaser.Math.RND.between(0, this.physics.world.bounds.width);
    zone.y = Phaser.Math.RND.between(0, this.physics.world.bounds.height);
  }

  update() {
    // this.controls.update(delta);

    this.player.body.setVelocity(0);

    // Horizontal movement
    if (this.cursors.left.isDown) {
      this.player.body.setVelocityX(-80);
    } else if (this.cursors.right.isDown) {
      this.player.body.setVelocityX(80);
    }

    // Vertical movement
    if (this.cursors.up.isDown) {
      this.player.body.setVelocityY(-80);
    } else if (this.cursors.down.isDown) {
      this.player.body.setVelocityY(80);
    }

    // Update the animation last and give left/right animations precedence over up/down animations
    if (this.cursors.left.isDown) {
      this.player.anims.play('left', true);
      this.player.flipX = true;
    } else if (this.cursors.right.isDown) {
      this.player.anims.play('right', true);
      this.player.flipX = false;
    } else if (this.cursors.up.isDown) {
      this.player.anims.play('up', true);
    } else if (this.cursors.down.isDown) {
      this.player.anims.play('down', true);
    } else {
      this.player.anims.stop();
    }
  }
}

var config = {
  type: Phaser.AUTO,
  parent: 'content',
  width: 320,
  height: 240,
  zoom: 3,
  pixelArt: true,
  physics: {
    default: 'arcade',
    arcade: {
      gravity: {
        y: 0
      },
      debug: true // set to true to view zones
    }
  },
  scene: [
    BootScene,
    WorldScene
  ]
};
var game = new Phaser.Game(config);