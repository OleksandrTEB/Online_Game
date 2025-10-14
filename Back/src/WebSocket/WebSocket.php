<?php

namespace App\WebSocket;

use Ratchet\MessageComponentInterface;
use Ratchet\ConnectionInterface;

class WebSocket implements MessageComponentInterface {
    protected \SplObjectStorage $clients;
    private array $rooms;
    private int $open_room;
    private int $reset;
    private int $first;

    public function __construct() {
        $this->clients = new \SplObjectStorage;
        $this->rooms = [];
        $this->open_room = 0;
        $this->reset = 0;
        $this->first = 0;
    }

    public function onOpen(ConnectionInterface $conn): void
    {
        if (!isset($this->rooms[$this->open_room])) {
            $this->rooms[$this->open_room] = [
                'players' => [],
                'clicked_sections' => []
            ];
        }

        if (count($this->rooms[$this->open_room]['players']) === 2)
        {
            $this->open_room++;
        }

        $this->rooms[$this->open_room]['players'][$conn->resourceId] = [];

        $this->clients->attach($conn);

        echo "Connect: " . count($this->clients) . "\n";
    }

    public function onMessage(ConnectionInterface $from, $msg): void
    {
        $data = json_decode($msg, true);

        $id = $from->resourceId;

        $room = 0;

        for ($i = 0; $i < count($this->rooms); $i++) {
            if (array_key_exists($id, $this->rooms[$i]['players'])) {
                $room = $i;
                break;
            }
        }

        switch ($data['type']) {
            case 'userinfo':
                $username = $data['username'];


                $char = count($this->rooms[$room]['players']) === 1 ? 'x' : 'o';
                $canStep = $char === 'x';

                $playerData = [
                    'username' => $username,
                    'char' => $char,
                    'canStep' => $canStep,
                ];

                $this->rooms[$this->open_room]['players'][$id] = $playerData;


                if (count($this->rooms[$room]['players']) === 2) {
                    foreach ($this->clients as $client) {
                        if (array_key_exists($client->resourceId, $this->rooms[$room]['players'])) {
                            $client->send(json_encode([
                                'players' => array_values($this->rooms[$room]['players']),
                                'canStart' => true,
                                'reset' => true
                            ]));
                        }
                    }
                }

//                ----------Helper Structure----------
//                $this->rooms = [
//                    '0' => [
//                        '43' => [
//                            'username' => 'Adam',
//                            'char' => 'o',
//                            'canStep' => false,
//                        ],
//                        '44' => [
//                            'username' => '2342342',
//                            'char' => 'x',
//                            'canStep' => true,
//                        ]
//                    ],
//                    '1' => [
//                        '23' => [
//                            'username' => 'Anna',
//                            'char' => 'o',
//                            'canStep' => false,
//                        ],
//                        '35' => [
//                            'username' => '2342342',
//                            'char' => 'x',
//                            'canStep' => true,
//                        ]
//                    ]
//                ];
                break;

            case 'wont-reset':
                $this->reset++;

                if ($this->reset >= 2) {
                    $this->reset = 0;
                    $this->rooms[$room]['clicked_sections'] = [];

                    if ($this->first === 0) {
                        $this->first = 1;
                    } else {
                        $this->first = 0;
                    }

                    for ($i = 0; $i < 2; $i++) {
                        $keys = array_keys($this->rooms[$room]['players']);

                        $currentPlayer =& $this->rooms[$room]['players'][$keys[$i]];

                        $currentPlayer['canStep'] = !$currentPlayer['canStep'];
                        if ($currentPlayer['char'] === 'x') {
                            $currentPlayer['char'] = 'o';
                            $currentPlayer['canStep'] = false;
                        } else {
                            $currentPlayer['char'] = 'x';
                            $currentPlayer['canStep'] = true;
                        }
                    }

                    foreach ($this->clients as $client) {
                        if (array_key_exists($client->resourceId, $this->rooms[$room]['players'])) {
                            $client->send(json_encode([
                                'reset' => true,
                                'players' => array_values($this->rooms[$room]['players'])
                            ]));
                        }
                    }
                }
                break;

            case 'clicked':
                if (!isset($this->rooms[$room]['clicked_sections'])) {
                    $this->rooms[$room]['clicked_sections'] = [];
                }

                if (!in_array($data['section'], $this->rooms[$room]['clicked_sections'])) {
                    $this->rooms[$room]['clicked_sections'][] = $data['section'];
                }
                foreach ($this->clients as $client) {
                    if ($client !== $from) {
                        if (array_key_exists($client->resourceId, $this->rooms[$room]['players'])) {
                            $client->send(json_encode([
                                'section' => $data['section'],
                                'clicked_sections' => $this->rooms[$room]['clicked_sections'],
                                'currentChar' => $data['currentChar'],
                            ]));
                        }
                    }
                }

                $keys = array_keys($this->rooms[$room]['players']);

                $user_data =& $this->rooms[$room]['players'];

                $i = 0;
                foreach ($this->clients as $client) {
                    if (array_key_exists($client->resourceId, $this->rooms[$room]['players'])) {
                        $user =& $user_data[$keys[$i]];
                        $user['canStep'] = !$user['canStep'];
                        $client->send(json_encode([
                            'canStep' => $user['canStep'],
                        ]));
                        $i++;
                    }
                }
                break;
            case 'win':
                foreach ($this->clients as $client) {
                    if (array_key_exists($client->resourceId, $this->rooms[$room]['players'])) {
                        $client->send(json_encode([
                            "win" => $data['win'],
                            'canStart' => true
                        ]));
                    }
                }
                break;
        }
    }

    public function onClose(ConnectionInterface $conn): void
    {
        $this->clients->detach($conn);
        echo "Disconnect:" . count($this->clients) . "\n";
    }

    public function onError(ConnectionInterface $conn, \Exception $e): void
    {
        $this->clients->detach($conn);
    }
}