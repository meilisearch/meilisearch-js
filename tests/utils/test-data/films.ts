export type Film = {
  id: number;
  title: string;
  overview: string;
  popularity: number;
  release_date: number;
  poster_path: string;
  providers: Record<string, { name: string; logo: string }[]>;
  genres: string[];
  language: string;
  // TODO: Should type these too in lib?
  _geo?: { lat: number; lng: number };
  _vectors: Record<string, number[] | null>;
};

export const FILMS: Film[] = [
  {
    id: 95,
    title: "Armageddon",
    overview:
      "When an asteroid threatens to collide with Earth, NASA honcho Dan Truman determines the only way to stop it is to drill into its surface and detonate a nuclear bomb. This leads him to renowned driller Harry Stamper, who agrees to helm the dangerous space mission provided he can bring along his own hotshot crew. Among them is the cocksure A.J. who Harry thinks isn't good enough for his daughter, until the mission proves otherwise.",
    popularity: 34.945,
    release_date: Date.parse("1998-07-01"),
    poster_path:
      "https://image.tmdb.org/t/p/w780/eTM3qtGhDU8cvjpoa6KEt5E2auU.jpg",
    providers: {
      buy: [
        {
          name: "Apple iTunes",
          logo: "/q6tl6Ib6X5FT80RMlcDbexIo4St.jpg",
        },
      ],
      rent: [
        {
          name: "Apple iTunes",
          logo: "/q6tl6Ib6X5FT80RMlcDbexIo4St.jpg",
        },
      ],
      flatrate: [
        {
          name: "fuboTV",
          logo: "/2wPRZit7b8u79GsqTdygmGL6kBW.jpg",
        },
      ],
    },
    genres: ["Action", "Thriller", "Science Fiction", "Adventure"],
    language: "en",
    _geo: { lat: 45.4777599, lng: 9.1967508 },
    _vectors: { default: [0.8] },
  },
  {
    id: 98,
    title: "Gladiator",
    overview:
      "In the year 180, the death of emperor Marcus Aurelius throws the Roman Empire into chaos.  Maximus is one of the Roman army's most capable and trusted generals and a key advisor to the emperor.  As Marcus' devious son Commodus ascends to the throne, Maximus is set to be executed.  He escapes, but is captured by slave traders.  Renamed Spaniard and forced to become a gladiator, Maximus must battle to the death with other men for the amusement of paying audiences.",
    popularity: 51.818,
    release_date: Date.parse("2000-05-01"),
    poster_path:
      "https://image.tmdb.org/t/p/w780/rotQFyaeNQivUJOm3J3M7YqPNMx.jpg",
    providers: {
      buy: [
        {
          name: "Apple iTunes",
          logo: "/q6tl6Ib6X5FT80RMlcDbexIo4St.jpg",
        },
      ],
      rent: [
        {
          name: "Apple iTunes",
          logo: "/q6tl6Ib6X5FT80RMlcDbexIo4St.jpg",
        },
      ],
      flatrate: [
        {
          name: "Netflix",
          logo: "/9A1JSVmSxsyaBK4SUFsYVqbAYfW.jpg",
        },
      ],
    },
    genres: ["Action", "Drama", "Adventure"],
    language: "en",
    _geo: { lat: 48.8826517, lng: 2.3352748 },
    _vectors: { default: [0.6] },
  },
  {
    id: 106,
    title: "Predator",
    overview:
      "A team of commandos on a mission in a Central American jungle find themselves hunted by an extraterrestrial warrior.",
    popularity: 44.021,
    release_date: Date.parse("1987-06-12"),
    poster_path:
      "https://image.tmdb.org/t/p/w780/iieEddHTv5zzTyr7OnN5ULOu7bI.jpg",
    providers: {
      buy: [
        {
          name: "Apple iTunes",
          logo: "/q6tl6Ib6X5FT80RMlcDbexIo4St.jpg",
        },
      ],
    },
    genres: ["Science Fiction", "Action", "Adventure", "Thriller"],
    language: "en",
    _vectors: { default: [0.1] },
  },
  {
    id: 97,
    title: "Tron",
    overview:
      "As Kevin Flynn searches for proof that he invented a hit video game, he is 'digitized' by a laser and finds himself inside 'The Grid', where programs suffer under the tyrannical rule of the Master Control Program (MCP). With the help of a security program called 'TRON', Flynn seeks to free The Grid from the MCP.",
    popularity: 16.007,
    release_date: Date.parse("1982-07-09"),
    poster_path:
      "https://image.tmdb.org/t/p/w780/zwSFEczP7AzqugAHHIX3zHniT0t.jpg",
    providers: {
      buy: [
        {
          name: "Apple iTunes",
          logo: "/q6tl6Ib6X5FT80RMlcDbexIo4St.jpg",
        },
      ],
      rent: [
        {
          name: "Apple iTunes",
          logo: "/q6tl6Ib6X5FT80RMlcDbexIo4St.jpg",
        },
      ],
    },
    genres: ["Science Fiction", "Action", "Adventure"],
    language: "en",
    _geo: { lat: 45.4632046, lng: 9.1719421 },
    _vectors: { default: [0.7] },
  },
  {
    id: 107,
    title: "Snatch",
    overview:
      "Unscrupulous boxing promoters, violent bookmakers, a Russian gangster, incompetent amateur robbers and supposedly Jewish jewelers fight to track down a priceless stolen diamond.",
    popularity: 18.364,
    release_date: Date.parse("2000-09-01"),
    poster_path:
      "https://image.tmdb.org/t/p/w780/56mOJth6DJ6JhgoE2jtpilVqJO.jpg",

    providers: {
      buy: [
        {
          name: "Apple iTunes",
          logo: "/q6tl6Ib6X5FT80RMlcDbexIo4St.jpg",
        },
      ],
      rent: [
        {
          name: "Apple iTunes",
          logo: "/q6tl6Ib6X5FT80RMlcDbexIo4St.jpg",
        },
      ],
    },

    genres: ["Crime", "Comedy"],
    language: "en",
    _vectors: { default: [-0.5] },
  },
  {
    id: 104,
    title: "Run Lola Run",
    overview:
      "Lola receives a phone call from her boyfriend Manni. He lost 100,000 DM in a subway train that belongs to a very bad guy. She has 20 minutes to raise this amount and meet Manni. Otherwise, he will rob a store to get the money. Three different alternatives may happen depending on some minor event along Lola's run.",
    popularity: 13.53,
    release_date: Date.parse("1998-03-03"),

    poster_path:
      "https://image.tmdb.org/t/p/w780/yBt6rkxRTP15nyOZOJt9pOgXDW0.jpg",

    providers: {
      buy: [
        {
          name: "Apple iTunes",
          logo: "/q6tl6Ib6X5FT80RMlcDbexIo4St.jpg",
        },
      ],
      rent: [
        {
          name: "Apple iTunes",
          logo: "/q6tl6Ib6X5FT80RMlcDbexIo4St.jpg",
        },
      ],
    },
    genres: ["Action", "Drama", "Thriller"],
    language: "en",
    _vectors: { default: null },
  },
  {
    id: 348,
    title: "Alien",
    overview:
      "During its return to the earth, commercial spaceship Nostromo intercepts a distress signal from a distant planet. When a three-member team of the crew discovers a chamber containing thousands of eggs on the planet, a creature inside one of the eggs attacks an explorer. The entire crew is unaware of the impending nightmare set to descend upon them when the alien parasite planted inside its unfortunate host is birthed.",
    popularity: 41.947,
    release_date: Date.parse("1979-05-25"),
    poster_path:
      "https://image.tmdb.org/t/p/w780/vfrQk5IPloGg1v9Rzbh2Eg3VGyM.jpg",
    providers: {
      buy: [
        {
          name: "Apple iTunes",
          logo: "/q6tl6Ib6X5FT80RMlcDbexIo4St.jpg",
        },
      ],
      rent: [
        {
          name: "Apple iTunes",
          logo: "/q6tl6Ib6X5FT80RMlcDbexIo4St.jpg",
        },
      ],
      flatrate: [
        {
          name: "Amazon Prime Video",
          logo: "/68MNrwlkpF7WnmNPXLah69CR5cb.jpg",
        },
      ],
    },
    genres: ["Horror", "Science Fiction"],
    language: "en",
    _vectors: { default: null },
  },
  {
    id: 402,
    title: "Basic Instinct",
    overview:
      "A violent police detective investigates a brutal murder that might involve a manipulative and seductive novelist.",
    popularity: 23.737,
    release_date: Date.parse("1992-03-20"),
    poster_path:
      "https://image.tmdb.org/t/p/w780/76Ts0yoHk8kVQj9MMnoMixhRWoh.jpg",
    providers: {
      buy: [
        {
          name: "Apple iTunes",
          logo: "/q6tl6Ib6X5FT80RMlcDbexIo4St.jpg",
        },
      ],
      rent: [
        {
          name: "Apple iTunes",
          logo: "/q6tl6Ib6X5FT80RMlcDbexIo4St.jpg",
        },
      ],
      flatrate: [
        {
          name: "HBO Max",
          logo: "/aS2zvJWn9mwiCOeaaCkIh4wleZS.jpg",
        },
      ],
    },
    genres: ["Thriller", "Mystery"],
    language: "en",
    _vectors: { default: null },
  },
  {
    id: 170,
    title: "28 Days Later",
    overview:
      "Twenty-eight days after a killer virus was accidentally unleashed from a British research facility, a small group of London survivors are caught in a desperate struggle to protect themselves from the infected. Carried by animals and humans, the virus turns those it infects into homicidal maniacs -- and it's absolutely impossible to contain.",
    popularity: 40.725,
    release_date: Date.parse("2002-10-31"),
    poster_path:
      "https://image.tmdb.org/t/p/w780/w4SL5hv0qOanrN7GjwNgtjF1RtD.jpg",

    providers: {
      buy: [
        {
          name: "Apple iTunes",
          logo: "/q6tl6Ib6X5FT80RMlcDbexIo4St.jpg",
        },
      ],
      rent: [
        {
          name: "Apple iTunes",
          logo: "/q6tl6Ib6X5FT80RMlcDbexIo4St.jpg",
        },
      ],
      flatrate: [
        {
          name: "HBO Max",
          logo: "/aS2zvJWn9mwiCOeaaCkIh4wleZS.jpg",
        },
      ],
    },
    genres: ["Horror", "Thriller", "Science Fiction"],
    language: "en",
    _vectors: { default: null },
  },
  {
    id: 508,
    title: "Love Actually",
    overview:
      "'Love Actually' follows the lives of eight very different couples dealing with their love lives, in various loosely and interrelated tales, all set during a frantic month before Christmas in London, England.",
    popularity: 21.26,
    release_date: Date.parse("2003-09-07"),
    poster_path:
      "https://image.tmdb.org/t/p/w780/7QPeVsr9rcFU9Gl90yg0gTOTpVv.jpg",
    providers: {
      buy: [
        {
          name: "Apple iTunes",
          logo: "/q6tl6Ib6X5FT80RMlcDbexIo4St.jpg",
        },
      ],
      rent: [
        {
          name: "Apple iTunes",
          logo: "/q6tl6Ib6X5FT80RMlcDbexIo4St.jpg",
        },
      ],
      flatrate: [
        {
          name: "IMDB TV Amazon Channel",
          logo: "/nd4NLxYeSv2TQ3HFzsecbAuSq1C.jpg",
        },
      ],
    },
    genres: ["Comedy", "Romance", "Drama"],
    language: "en",
    _vectors: { default: null },
  },
  {
    id: 200,
    title: "Star Trek: Insurrection",
    overview:
      'When an alien race and factions within Starfleet attempt to take over a planet that has "regenerative" properties, it falls upon Captain Picard and the crew of the Enterprise to defend the planet\'s people as well as the very ideals upon which the Federation itself was founded.',
    popularity: 17.696,
    release_date: Date.parse("1998-12-11"),
    poster_path:
      "https://image.tmdb.org/t/p/w780/9pbc44kltJhArUNyrdQcantMEvH.jpg",
    providers: {
      buy: [
        {
          name: "Apple iTunes",
          logo: "/q6tl6Ib6X5FT80RMlcDbexIo4St.jpg",
        },
      ],
    },
    genres: ["Science Fiction", "Action", "Adventure", "Thriller"],
    language: "en",
    _vectors: { default: null },
  },
  {
    id: 155,
    title: "The Dark Knight",
    overview:
      "Batman raises the stakes in his war on crime. With the help of Lt. Jim Gordon and District Attorney Harvey Dent, Batman sets out to dismantle the remaining criminal organizations that plague the streets. The partnership proves to be effective, but they soon find themselves prey to a reign of chaos unleashed by a rising criminal mastermind known to the terrified citizens of Gotham as the Joker.",
    popularity: 68.919,
    release_date: Date.parse("2008-07-14"),
    poster_path:
      "https://image.tmdb.org/t/p/w780/qJ2tW6WMUDux911r6m7haRef0WH.jpg",
    providers: {
      buy: [
        {
          name: "Apple iTunes",
          logo: "/q6tl6Ib6X5FT80RMlcDbexIo4St.jpg",
        },
      ],
      rent: [
        {
          name: "Apple iTunes",
          logo: "/q6tl6Ib6X5FT80RMlcDbexIo4St.jpg",
        },
      ],
      flatrate: [
        {
          name: "HBO Max",
          logo: "/aS2zvJWn9mwiCOeaaCkIh4wleZS.jpg",
        },
      ],
    },
    genres: ["Drama", "Action", "Crime", "Thriller"],
    language: "en",
    _vectors: { default: null },
  },
  {
    id: 217,
    title: "Indiana Jones and the Kingdom of the Crystal Skull",
    overview:
      "Set during the Cold War, the Soviets—led by sword-wielding Irina Spalko—are in search of a crystal skull which has supernatural powers related to a mystical Lost City of Gold. Indy is coerced to head to Peru at the behest of a young man whose friend—and Indy's colleague—Professor Oxley has been captured for his knowledge of the skull's whereabouts.",
    popularity: 27.343,
    release_date: Date.parse("2008-05-21"),
    poster_path:
      "https://image.tmdb.org/t/p/w780/56As6XEM1flWvprX4LgkPl8ii4K.jpg",

    providers: {
      buy: [
        {
          name: "Apple iTunes",
          logo: "/q6tl6Ib6X5FT80RMlcDbexIo4St.jpg",
        },
      ],
    },
    genres: ["Adventure", "Action"],
    language: "en",
    _vectors: { default: null },
  },
  {
    id: 185,
    title: "A Clockwork Orange",
    overview:
      "In a near-future Britain, young Alexander DeLarge and his pals get their kicks beating and raping anyone they please. When not destroying the lives of others, Alex swoons to the music of Beethoven. The state, eager to crack down on juvenile crime, gives an incarcerated Alex the option to undergo an invasive procedure that'll rob him of all personal agency. In a time when conscience is a commodity, can Alex change his tune?",
    popularity: 33.915,
    release_date: Date.parse("1971-12-19"),
    poster_path:
      "https://image.tmdb.org/t/p/w780/4sHeTAp65WrSSuc05nRBKddhBxO.jpg",
    providers: {
      rent: [
        {
          name: "Apple iTunes",
          logo: "/q6tl6Ib6X5FT80RMlcDbexIo4St.jpg",
        },
      ],
    },

    genres: ["Science Fiction", "Drama"],
    language: "en",
    _vectors: { default: null },
  },
  {
    id: 162,
    title: "Edward Scissorhands",
    overview:
      "A small suburban town receives a visit from a castaway unfinished science experiment named Edward.",
    popularity: 41.017,
    release_date: Date.parse("1990-12-05"),
    poster_path:
      "https://image.tmdb.org/t/p/w780/1RFIbuW9Z3eN9Oxw2KaQG5DfLmD.jpg",
    providers: {
      buy: [
        {
          name: "Apple iTunes",
          logo: "/q6tl6Ib6X5FT80RMlcDbexIo4St.jpg",
        },
      ],
      rent: [
        {
          name: "Apple iTunes",
          logo: "/q6tl6Ib6X5FT80RMlcDbexIo4St.jpg",
        },
      ],
    },
    genres: ["Fantasy", "Drama", "Romance"],
    language: "en",
    _vectors: { default: null },
  },
  {
    id: 364,
    title: "Batman Returns",
    overview:
      "While Batman deals with a deformed man calling himself the Penguin, an employee of a corrupt businessman transforms into the Catwoman.",
    popularity: 27.257,
    release_date: Date.parse("1992-06-19"),
    poster_path:
      "https://image.tmdb.org/t/p/w780/jKBjeXM7iBBV9UkUcOXx3m7FSHY.jpg",
    providers: {
      buy: [
        {
          name: "Apple iTunes",
          logo: "/q6tl6Ib6X5FT80RMlcDbexIo4St.jpg",
        },
      ],
      rent: [
        {
          name: "Apple iTunes",
          logo: "/q6tl6Ib6X5FT80RMlcDbexIo4St.jpg",
        },
      ],
      flatrate: [
        {
          name: "HBO Max",
          logo: "/aS2zvJWn9mwiCOeaaCkIh4wleZS.jpg",
        },
      ],
    },
    genres: ["Action", "Fantasy"],
    language: "en",
    _vectors: { default: null },
  },
  {
    id: 196,
    title: "Back to the Future Part III",
    overview:
      "The final installment of the Back to the Future trilogy finds Marty digging the trusty DeLorean out of a mineshaft and looking for Doc in the Wild West of 1885. But when their time machine breaks down, the travelers are stranded in a land of spurs. More problems arise when Doc falls for pretty schoolteacher Clara Clayton, and Marty tangles with Buford Tannen.",
    popularity: 27.714,
    release_date: Date.parse("1990-05-25"),
    poster_path:
      "https://image.tmdb.org/t/p/w780/crzoVQnMzIrRfHtQw0tLBirNfVg.jpg",
    providers: {
      buy: [
        {
          name: "Apple iTunes",
          logo: "/q6tl6Ib6X5FT80RMlcDbexIo4St.jpg",
        },
      ],
    },
    genres: ["Adventure", "Comedy", "Science Fiction"],
    language: "en",
    _vectors: { default: null },
  },
  {
    id: 180,
    title: "Minority Report",
    overview:
      "John Anderton is a top 'Precrime' cop in the late-21st century, when technology can predict crimes before they're committed. But Anderton becomes the quarry when another investigator targets him for a murder charge.",
    popularity: 20.598,
    release_date: Date.parse("2002-06-20"),
    poster_path:
      "https://image.tmdb.org/t/p/w780/ccqpHq5tk5W4ymbSbuoy4uYOxFI.jpg",
    providers: {
      buy: [
        {
          name: "Apple iTunes",
          logo: "/q6tl6Ib6X5FT80RMlcDbexIo4St.jpg",
        },
      ],
      rent: [
        {
          name: "Apple iTunes",
          logo: "/q6tl6Ib6X5FT80RMlcDbexIo4St.jpg",
        },
      ],
      flatrate: [{ name: "Hulu", logo: "/giwM8XX4V2AQb9vsoN7yti82tKK.jpg" }],
    },
    genres: ["Action", "Thriller", "Science Fiction", "Mystery"],
    language: "en",
    _vectors: { default: null },
  },
  {
    id: 114,
    title: "Pretty Woman",
    overview:
      "When a millionaire wheeler-dealer enters a business contract with a Hollywood hooker Vivian Ward, he loses his heart in the bargain.",
    popularity: 35.235,
    release_date: Date.parse("1990-03-23"),
    poster_path:
      "https://image.tmdb.org/t/p/w780/hMVMMy1yDUvdufpTl8J8KKNYaZX.jpg",
    providers: {
      buy: [
        {
          name: "Apple iTunes",
          logo: "/q6tl6Ib6X5FT80RMlcDbexIo4St.jpg",
        },
      ],
      rent: [
        {
          name: "Google Play Movies",
          logo: "/p3Z12gKq2qvJaUOMeKNU2mzKVI9.jpg",
        },
        {
          name: "AMC on Demand",
          logo: "/p1e92kLeYHalxC9GClqNJ75lBDG.jpg",
        },
      ],
      flatrate: [
        {
          name: "fuboTV",
          logo: "/2wPRZit7b8u79GsqTdygmGL6kBW.jpg",
        },
      ],
    },
    genres: ["Romance", "Comedy"],
    language: "en",
    _vectors: { default: null },
  },
  {
    id: 65,
    title: "8 Mile",
    overview:
      'The setting is Detroit in 1995. The city is divided by 8 Mile, a road that splits the town in half along racial lines. A young white rapper, Jimmy "B-Rabbit" Smith Jr. summons strength within himself to cross over these arbitrary boundaries to fulfill his dream of success in hip hop. With his pal Future and the three one third in place, all he has to do is not choke.',
    popularity: 30.162,
    release_date: Date.parse("2002-11-08"),
    poster_path:
      "https://image.tmdb.org/t/p/w780/7BmQj8qE1FLuLTf7Xjf9sdIHzoa.jpg",
    providers: {
      buy: [
        {
          name: "Apple iTunes",
          logo: "/q6tl6Ib6X5FT80RMlcDbexIo4St.jpg",
        },
      ],
      rent: [
        {
          name: "Apple iTunes",
          logo: "/q6tl6Ib6X5FT80RMlcDbexIo4St.jpg",
        },
      ],
      flatrate: [
        {
          name: "HBO Max",
          logo: "/aS2zvJWn9mwiCOeaaCkIh4wleZS.jpg",
        },
      ],
    },
    genres: ["Music", "Drama"],
    language: "en",
    _vectors: { default: null },
  },
  {
    id: 165,
    title: "Back to the Future Part II",
    overview:
      "Marty and Doc are at it again in this wacky sequel to the 1985 blockbuster as the time-traveling duo head to 2015 to nip some McFly family woes in the bud. But things go awry thanks to bully Biff Tannen and a pesky sports almanac. In a last-ditch attempt to set things straight, Marty finds himself bound for 1955 and face to face with his teenage parents -- again.",
    popularity: 26.354,
    release_date: Date.parse("1989-11-22"),
    poster_path:
      "https://image.tmdb.org/t/p/w780/hQq8xZe5uLjFzSBt4LanNP7SQjl.jpg",
    providers: {
      buy: [
        {
          name: "Apple iTunes",
          logo: "/q6tl6Ib6X5FT80RMlcDbexIo4St.jpg",
        },
      ],
      rent: [
        {
          name: "Apple iTunes",
          logo: "/q6tl6Ib6X5FT80RMlcDbexIo4St.jpg",
        },
      ],
      flatrate: [
        {
          name: "AMC Plus",
          logo: "/9DrynzGqT6DNLoc4BB3rlcxFRn.jpg",
        },
      ],
    },
    genres: ["Adventure", "Comedy", "Family", "Science Fiction"],
    language: "en",
    _vectors: { default: null },
  },
  {
    id: 197,
    title: "Braveheart",
    overview:
      "Enraged at the slaughter of Murron, his new bride and childhood love, Scottish warrior William Wallace slays a platoon of the local English lord's soldiers. This leads the village to revolt and, eventually, the entire country to rise up against English rule.",
    popularity: 36.408,
    release_date: Date.parse("1995-03-14"),
    poster_path:
      "https://image.tmdb.org/t/p/w780/uE2Q9RaNBdJbAV1N67LhwCYluK0.jpg",
    providers: {
      buy: [
        {
          name: "Apple iTunes",
          logo: "/q6tl6Ib6X5FT80RMlcDbexIo4St.jpg",
        },
      ],
    },
    genres: ["Action", "Drama", "History", "War"],
    language: "en",
    _vectors: { default: null },
  },
  {
    id: 607,
    title: "Men in Black",
    overview:
      "After a police chase with an otherworldly being, a New York City cop is recruited as an agent in a top-secret organization established to monitor and police alien activity on Earth: the Men in Black. Agent Kay and new recruit Agent Jay find themselves in the middle of a deadly plot by an intergalactic terrorist who has arrived on Earth to assassinate two ambassadors from opposing galaxies.",
    popularity: 35.303,
    release_date: Date.parse("1997-07-02"),
    poster_path:
      "https://image.tmdb.org/t/p/w780/uLOmOF5IzWoyrgIF5MfUnh5pa1X.jpg",
    providers: {
      buy: [
        {
          name: "Apple iTunes",
          logo: "/q6tl6Ib6X5FT80RMlcDbexIo4St.jpg",
        },
      ],
    },
    genres: ["Action", "Adventure", "Comedy", "Science Fiction"],
    language: "en",
    _vectors: { default: null },
  },
  {
    id: 24,
    title: "Kill Bill: Vol. 1",
    overview:
      "An assassin is shot by her ruthless employer, Bill, and other members of their assassination circle – but she lives to plot her vengeance.",
    popularity: 36.782,
    release_date: Date.parse("2003-10-10"),
    poster_path:
      "https://image.tmdb.org/t/p/w780/v7TaX8kXMXs5yFFGR41guUDNcnB.jpg",
    providers: {
      buy: [
        {
          name: "Google Play Movies",
          logo: "/p3Z12gKq2qvJaUOMeKNU2mzKVI9.jpg",
        },
      ],
    },
    genres: ["Action", "Crime"],
    language: "en",
    _vectors: { default: null },
  },
  {
    id: 393,
    title: "Kill Bill: Vol. 2",
    overview:
      "The Bride unwaveringly continues on her roaring rampage of revenge against the band of assassins who had tried to kill her and her unborn child. She visits each of her former associates one-by-one, checking off the victims on her Death List Five until there's nothing left to do … but kill Bill.",
    popularity: 32.364,
    release_date: Date.parse("2004-04-16"),
    poster_path:
      "https://image.tmdb.org/t/p/w780/2yhg0mZQMhDyvUQ4rG1IZ4oIA8L.jpg",
    providers: {
      buy: [
        {
          name: "Google Play Movies",
          logo: "/p3Z12gKq2qvJaUOMeKNU2mzKVI9.jpg",
        },
      ],
    },
    genres: ["Action", "Crime", "Thriller"],
    language: "en",
    _vectors: { default: null },
  },
  {
    id: 606,
    title: "Out of Africa",
    overview:
      "Out of Africa tells the story of the life of Danish author Karen Blixen, who at the beginning of the 20th century moved to Africa to build a new life for herself. The film is based on the autobiographical novel by Karen Blixen from 1937.",
    popularity: 15.148,
    release_date: Date.parse("1985-12-20"),
    poster_path:
      "https://image.tmdb.org/t/p/w780/3eLAm1kuVD5QZCOydbiu7j6GAbw.jpg",
    providers: {
      buy: [
        {
          name: "Apple iTunes",
          logo: "/q6tl6Ib6X5FT80RMlcDbexIo4St.jpg",
        },
      ],
    },
    genres: ["History", "Romance", "Drama"],
    language: "en",
    _vectors: { default: null },
  },
  {
    id: 608,
    title: "Men in Black II",
    overview:
      "Kay and Jay reunite to provide our best, last and only line of defense against a sinister seductress who levels the toughest challenge yet to the MIB's untarnished mission statement – protecting Earth from the scum of the universe. It's been four years since the alien-seeking agents averted an intergalactic disaster of epic proportions. Now it's a race against the clock as Jay must convince Kay – who not only has absolutely no memory of his time spent with the MIB, but is also the only living person left with the expertise to save the galaxy – to reunite with the MIB before the earth submits to ultimate destruction.",
    popularity: 31.8,
    release_date: Date.parse("2002-07-03"),
    poster_path:
      "https://image.tmdb.org/t/p/w780/enA22EPyzc2WQ1VVyY7zxresQQr.jpg",
    providers: {
      buy: [
        {
          name: "Apple iTunes",
          logo: "/q6tl6Ib6X5FT80RMlcDbexIo4St.jpg",
        },
      ],
    },
    genres: ["Action", "Adventure", "Comedy", "Science Fiction"],
    language: "en",
    _vectors: { default: null },
  },
  {
    id: 115,
    title: "The Big Lebowski",
    overview:
      "Jeffrey 'The Dude' Lebowski, a Los Angeles slacker who only wants to bowl and drink White Russians, is mistaken for another Jeffrey Lebowski, a wheelchair-bound millionaire, and finds himself dragged into a strange series of events involving nihilists, adult film producers, ferrets, errant toes, and large sums of money.",
    popularity: 20.46,
    release_date: Date.parse("1998-03-06"),
    poster_path:
      "https://image.tmdb.org/t/p/w780/84zhHB9wreAwPxGXys8CxSk9ARr.jpg",
    providers: {
      buy: [
        {
          name: "Apple iTunes",
          logo: "/q6tl6Ib6X5FT80RMlcDbexIo4St.jpg",
        },
      ],
    },
    genres: ["Comedy", "Crime"],
    language: "en",
    _vectors: { default: null },
  },
  {
    id: 389,
    title: "12 Angry Men",
    overview:
      "The defense and the prosecution have rested and the jury is filing into the jury room to decide if a young Spanish-American is guilty or innocent of murdering his father. What begins as an open and shut case soon becomes a mini-drama of each of the jurors' prejudices and preconceptions about the trial, the accused, and each other.",
    popularity: 18.549,
    release_date: Date.parse("1957-04-10"),
    poster_path:
      "https://image.tmdb.org/t/p/w780/e02s4wmTAExkKg0yF4dEG98ZRpK.jpg",
    providers: {
      buy: [
        {
          name: "Apple iTunes",
          logo: "/q6tl6Ib6X5FT80RMlcDbexIo4St.jpg",
        },
      ],
    },
    genres: ["Drama"],
    language: "en",
    _vectors: { default: null },
  },
  {
    id: 11,
    title: "Star Wars",
    overview:
      "Princess Leia is captured and held hostage by the evil Imperial forces in their effort to take over the galactic Empire. Venturesome Luke Skywalker and dashing captain Han Solo team together with the loveable robot duo R2-D2 and C-3PO to rescue the beautiful princess and restore peace and justice in the Empire.",
    popularity: 68.013,
    release_date: Date.parse("1977-05-25"),
    poster_path:
      "https://image.tmdb.org/t/p/w780/6FfCtAuVAW8XJjZ7eWeLibRLWTw.jpg",
    providers: {
      buy: [
        {
          name: "Apple iTunes",
          logo: "/q6tl6Ib6X5FT80RMlcDbexIo4St.jpg",
        },
      ],
    },
    genres: ["Adventure", "Action", "Science Fiction"],
    language: "en",
    _vectors: { default: null },
  },
  {
    id: 161,
    title: "Ocean's Eleven",
    overview:
      "Less than 24 hours into his parole, charismatic thief Danny Ocean is already rolling out his next plan: In one night, Danny's hand-picked crew of specialists will attempt to steal more than $150 million from three Las Vegas casinos. But to score the cash, Danny risks his chances of reconciling with ex-wife, Tess.",
    popularity: 24.355,
    release_date: Date.parse("2001-12-07"),
    poster_path:
      "https://image.tmdb.org/t/p/w780/v5D7K4EHuQHFSjveq8LGxdSfrGS.jpg",
    providers: {
      buy: [
        {
          name: "Apple iTunes",
          logo: "/q6tl6Ib6X5FT80RMlcDbexIo4St.jpg",
        },
      ],
    },
    genres: ["Thriller", "Crime"],
    language: "en",
    _vectors: { default: null },
  },
  {
    id: 18,
    title: "The Fifth Element",
    overview:
      "In 2257, a taxi driver is unintentionally given the task of saving a young girl who is part of the key that will ensure the survival of humanity.",
    popularity: 37.356,
    release_date: Date.parse("1997-05-02"),
    poster_path:
      "https://image.tmdb.org/t/p/w780/fPtlCO1yQtnoLHOwKtWz7db6RGU.jpg",
    providers: {
      buy: [
        {
          name: "Apple iTunes",
          logo: "/q6tl6Ib6X5FT80RMlcDbexIo4St.jpg",
        },
      ],
    },
    genres: ["Adventure", "Fantasy", "Action", "Thriller", "Science Fiction"],
    language: "en",
    _vectors: { default: null },
  },
  {
    id: 138,
    title: "Dracula",
    overview:
      "British estate agent Renfield travels to Transylvania to meet with the mysterious Count Dracula, who is interested in leasing a castle in London and is, unbeknownst to Renfield, a vampire. After Dracula enslaves Renfield and drives him to insanity, the pair sail to London together, and as Dracula begins preying on London socialites, the two become the subject of study for a supernaturalist professor, Abraham Van Helsing.",
    popularity: 13.227,
    release_date: Date.parse("1931-02-12"),
    poster_path:
      "https://image.tmdb.org/t/p/w780/ueVSPt7vAba0XScHWTDWS5tNxYX.jpg",
    providers: {
      buy: [
        {
          name: "Apple iTunes",
          logo: "/q6tl6Ib6X5FT80RMlcDbexIo4St.jpg",
        },
      ],
    },
    genres: ["Horror", "Drama", "Fantasy"],
    language: "en",
    _vectors: { default: null },
  },
];
