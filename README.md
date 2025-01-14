# Teaching-HEIGVD-API-2022-Labo-Orchestra

## Admin

- **You can work in groups of 2 students**.
- It is up to you if you want to fork this repo, or if you prefer to work in a private repo. However, you have to **use exactly the same directory structure for the validation procedure to work**.
- We expect that you will have more issues and questions than with other labs (because we have a left some questions open on purpose). Please ask your questions on Teams, so that everyone in the class can benefit from the discussion.
- ⚠️ You will have to send your GitHub URL, answer the questions and send the output log of the `validate.sh` script, which prove that your project is working [in this Google Form](https://forms.gle/6SM7cu4cYhNsRvqX8).

## Objectives

This lab has 4 objectives:

- The first objective is to **design and implement a simple application protocol on top of UDP**. It will be very similar to the protocol presented during the lecture (where thermometers were publishing temperature events in a multicast group and where a station was listening for these events).

- The second objective is to get familiar with several tools from **the JavaScript ecosystem**. You will implement two simple **Node.js** applications. You will also have to search for and use a couple of **npm modules** (i.e. third-party libraries).

- The third objective is to continue practicing with **Docker**. You will have to create 2 Docker images (they will be very similar to the images presented in class). You will then have to run multiple containers based on these images.

- Last but not least, the fourth objective is to **work with a bit less upfront guidance**, as compared with previous labs. This time, we do not provide a complete webcast to get you started, because we want you to search for information (this is a very important skill that we will increasingly train). Don't worry, we have prepared a fairly detailed list of tasks that will put you on the right track. If you feel a bit overwhelmed at the beginning, make sure to read this document carefully and to find answers to the questions asked in the tables. You will see that the whole thing will become more and more approachable.

## Requirements

In this lab, you will **write 2 small NodeJS applications** and **package them in Docker images**:

- the first app, **Musician**, simulates someone who plays an instrument in an orchestra. When the app is started, it is assigned an instrument (piano, flute, etc.). As long as it is running, every second it will emit a sound (well... simulate the emission of a sound: we are talking about a communication protocol). Of course, the sound depends on the instrument.

- the second app, **Auditor**, simulates someone who listens to the orchestra. This application has two responsibilities. Firstly, it must listen to Musicians and keep track of **active** musicians. A musician is active if it has played a sound during the last 5 seconds. Secondly, it must make this information available to you. Concretely, this means that it should implement a very simple TCP-based protocol.

![image](images/joke.jpg)

### Instruments and sounds

The following table gives you the mapping between instruments and sounds. Please **use exactly the same string values** in your code, so that validation procedures can work.

| Instrument | Sound       |
|------------|-------------|
| `piano`    | `ti-ta-ti`  |
| `trumpet`  | `pouet`     |
| `flute`    | `trulu`     |
| `violin`   | `gzi-gzi`   |
| `drum`     | `boum-boum` |

### TCP-based protocol to be implemented by the Auditor application

- The auditor should include a TCP server and accept connection requests on port 2205.
- After accepting a connection request, the auditor must send a JSON payload containing the list of <u>active</u> musicians, with the following format (it can be a single line, without indentation):

```
[
  {
  	"uuid" : "aa7d8cb3-a15f-4f06-a0eb-b8feb6244a60",
  	"instrument" : "piano",
  	"activeSince" : "2016-04-27T05:20:50.731Z"
  },
  {
  	"uuid" : "06dbcbeb-c4c8-49ed-ac2a-cd8716cbf2d3",
  	"instrument" : "flute",
  	"activeSince" : "2016-04-27T05:39:03.211Z"
  }
]
```

### What you should be able to do at the end of the lab

You should be able to start an **Auditor** container with the following command:

```
$ docker run -d -p 2205:2205 res/auditor
```

You should be able to connect to your **Auditor** container over TCP and see that there is no active musician.

```
$ telnet IP_ADDRESS_THAT_DEPENDS_ON_YOUR_SETUP 2205
[]
```

You should then be able to start a first **Musician** container with the following command:

```
$ docker run -d res/musician piano
```

After this, you should be able to verify two points. Firstly, if you connect to the TCP interface of your **Auditor** container, you should see that there is now one active musician (you should receive a JSON array with a single element). Secondly, you should be able to use `tcpdump` to monitor the UDP datagrams generated by the **Musician** container.

You should then be able to kill the **Musician** container, wait 5 seconds and connect to the TCP interface of the **Auditor** container. You should see that there is now no active musician (empty array).

You should then be able to start several **Musician** containers with the following commands:

```
$ docker run -d res/musician piano
$ docker run -d res/musician flute
$ docker run -d res/musician flute
$ docker run -d res/musician drum
```

When you connect to the TCP interface of the **Auditor**, you should receive an array of musicians that corresponds to your commands. You should also use `tcpdump` to monitor the UDP trafic in your system.

# Tasks and questions

Reminder: answer the following questions [here](https://forms.gle/6SM7cu4cYhNsRvqX8).

## Task 1: design the application architecture and protocols

| #        | Topic                                                                                                                                                                                                                                                                                                                                                            |
|----------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Question | How can we represent the system in an **architecture diagram**, which gives information both about the Docker containers, the communication protocols and the commands?                                                                                                                                                                                          |
|          | ![image-20220612142822756](./images/image-20220612142822756.png)                                                                                                                                                                                                                                                                                                 |
| Question | Who is going to **send UDP datagrams** and **when**?                                                                                                                                                                                                                                                                                                             |
|          | _Musicians_ send the UDP datagram. The datagram is send each second.                                                                                                                                                                                                                                                                                             |
| Question | Who is going to **listen for UDP datagrams** and what should happen when a datagram is received?                                                                                                                                                                                                                                                                 |
|          | The auditor subscribes to the IP address where the datagram is send. if a new UUID is received from a new musician, the auditor adds it on his list of musician.                                                                                                                                                                                                 |
| Question | What **payload** should we put in the UDP datagrams? The payload contain the UUID of the musician and the sound of his instrument.                                                                                                                                                                                                                               |
|          | We send the payload as a JSON format. It contains the UUID of the musician and the sound of his instrument.                                                                                                                                                                                                                                                      |
| Question | What **data structures** do we need in the UDP sender and receiver? When will we update these data structures? When will we query these data structures?                                                                                                                                                                                                         |
|          | The data structure used by the auditor to know the existence of musicians is a list that contains the last activity date, the instrument and the UUID of the musician. If the UUID send by the musician is not present on the list, it will be update by adding the new musician. Another data structure, a map, is use to associate the sound to an instrument. |

## Task 2: implement a "musician" Node.js application

| #        | Topic                                                                                                                                                  |
|----------|--------------------------------------------------------------------------------------------------------------------------------------------------------|
| Question | In a JavaScript program, if we have an object, how can we **serialize it in JSON**?                                                                    |
|          | `JSON.stringify` to convert to a string and `JSON.parse` to read **from** a string.                                                                    |
| Question | What is **npm**?                                                                                                                                       |
|          | **npm** (**N**ode **P**ackage **M**anager) is a package manager used by Node.js. It provides *Javascript* packages (plugins) and manages dependencies. |
| Question | What is the `npm install` command?                                                                                                                     |
|          | Install the dependencies in a local node modules directory.                                                                                            |
| Question | How can we use the `https://www.npmjs.com/` web site?                                                                                                  |
|          | The website allows us to know what packages are available and which versions.                                                                          |
| Question | In JavaScript, how can we **generate a UUID** compliant with RFC4122?                                                                                  |
|          | We can simply use the `uuid` package that does it for us (https://www.npmjs.com/package/uuid).                                                         |
| Question | In Node.js, how can we execute a function on a **periodic** basis?                                                                                     |
|          | We use the built-in `setInterval` function.                                                                                                            |
| Question | In Node.js, how can we **emit UDP datagrams**?                                                                                                         |
|          | First of all we need to create the socket with `dgram.createSocket("udp4") than we send the payload at a specific address and port.                    |
| Question | In Node.js, how can we **access the command line arguments**?                                                                                          |
|          | Using `process.argv`.                                                                                                                                  |

## Task 3: package the "musician" app in a Docker image

| #        | Topic                                                                                                                                                                                                                                                                                                          |
|----------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Question | How do we **define and build our own Docker image**?                                                                                                                                                                                                                                                           |
|          | We create a dockerfile that contains informations to build, like the source image (that can be pulled from dockerhub (https://hub.docker.com/)), if we want to copy files on container  what we want to install. After creating the dockerfile we can use the commande line "docker build" to build the image. |
| Question | How can we use the `ENTRYPOINT` statement in our Dockerfile?                                                                                                                                                                                                                                                   |
|          | ENTRYPOINT argument on the docker file give us a way to identify which executable should be run when a container is started from our image.                                                                                                                                                                    |
| Question | After building our Docker image, how do we use it to **run containers**?                                                                                                                                                                                                                                       |
|          | `docker run <name of the image>`                                                                                                                                                                                                                                                                               |
| Question | How do we get the list of all **running containers**?                                                                                                                                                                                                                                                          |
|          | `docker ps`                                                                                                                                                                                                                                                                                                    |
| Question | How do we **stop** and **kill** one running container?                                                                                                                                                                                                                                                         |
|          | `docker kill container <name of the container>`                                                                                                                                                                                                                                                                |
| Question | How can we check that our running containers are effectively sending UDP datagrams?                                                                                                                                                                                                                            |
|          | By using wireshark, we can analyze the traffic between each container.                                                                                                                                                                                                                                         |

## Task 4: implement an "auditor" Node.js application

| #        | Topic                                                                                                                                                                                                        |
|----------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Question | With Node.js, how can we listen for UDP datagrams in a multicast group?                                                                                                                                      |
|          | We first need to bind the socket to a port `bind(PORT, callback)` then we can make it join a *multicast group* with `socket.addMembership(ADDRESS))`.                                                        |
| Question | How can we use the `Map` built-in object introduced in ECMAScript 6 to implement a **dictionary**?                                                                                                           |
|          | For example: `const map = new Map(); map.set("piano", "ti-ta-ti")` creates a "dictionary" which the indexed key `piano` has the value `"ti-ta-ti"`. We can also check that a key exists with `map.has(key);` |
| Question | How can we use the `Day.js` npm module to help us with **date manipulations** and formatting?                                                                                                                |
|          | (We simply used the build-in `Date` class) We could use the `diff` function to check when a _Musician_ "expired" (https://day.js.org/docs/en/display/difference)                                             |
| Question | When and how do we **get rid of inactive players**?                                                                                                                                                          |
|          | A _Musician_ is considered inactive after 5 seconds without request. He is removed from the list when the list is requested from a TCP server.                                                               |
| Question | How do I implement a **simple TCP server** in Node.js?                                                                                                                                                       |
|          | By using the **net** package to create a simple TCP server: `net.createServer()`. Then we add a callback function on the `connection` event that will return (write) the musicians in our case.              |

## Task 5: package the "auditor" app in a Docker image

| #        | Topic                                                                                                                                                                         |
|----------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Question | How do we validate that the whole system works, once we have built our Docker image?                                                                                          |
|          | The script [validate.sh](./validate.sh) is provided. It checks if musicians are added to the list and check if the list is updated if a musician hasn't played for 5 seconds. |

## Constraints

Please be careful to add here the specifications in this document, and in particular

- the Docker image names
  - `api/auditor` for the auditor
  - `api/musician` for a musician
- the names of instruments and their sounds
  - drum: `boum-boum`,
  - flute: `trulu`,
  - piano: `ti-ta-ti`,
  - trumpet: `pouet`,
  - violin: `gzi-gzi`
- the TCP PORT number
  - `7890`

Also, we have prepared two directories, where you should place your two `Dockerfile` with their dependent files.

### Validation

Have a look at the `validate.sh` script located in the top-level directory. This script automates part of the validation process for your implementation (it will gradually be expanded with additional operations and assertions). As soon as you start creating your Docker images (i.e. creating your Dockerfiles), you should **try to run it** to see if your implementation is correct. When you submit your project in the [Google Form](https://forms.gle/6SM7cu4cYhNsRvqX8), the script will be used for grading, together with other criteria.
