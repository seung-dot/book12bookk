import { ActivityDefinition } from '../types';

export const ACTIVITIES: ActivityDefinition[] = [
  {
    id: 'emotion',
    orderNumber: '01',
    title: '오늘의 마음 온도',
    subtitle: '책을 덮고 난 후, 마음속에 가장 먼저 떠오른 감정의 파동',
    type: 'emotion',
    timeEstimate: '10분',
    quote: '“내게 금지된 것을 소망하기 시작했을 때, 비로소 나는 살아있음을 느꼈다.”',
    questions: [
      {
        key: 'selectedEmotion',
        label: '책을 읽고 난 현재 감정을 선택해주세요.',
        options: [
          '흥미로웠다',
          '불편했다',
          '화가 났다',
          '답답했다',
          '통쾌했다',
          '혼란스러웠다',
          '생각이 많아졌다',
          '기타',
        ],
      },
      {
        key: 'emotionReason',
        label: '왜 이런 감정이 들었나요?',
        placeholder: '이 책을 읽으며 가장 크게 와닿았던 감정과 그 이유를 편안하게 적어주세요.',
      },
    ],
    hostDiscussionPoints: [
      '5명의 감정이 서로 어떻게 다른지 비교해보세요.',
      '‘불편했다’와 ‘통쾌했다’처럼 상반된 감정이 나온 지점을 주목해보세요.',
      '소설이 출간된 1990년대 독자들의 충격과 지금 우리의 시선은 어떻게 다를까요?',
    ],
  },
  {
    id: 'scene',
    orderNumber: '02',
    title: '내가 가장 인상 깊었던 장면',
    subtitle: '책장을 덮어도 선명하게 기억 속에 각인된 한 장면',
    type: 'scene',
    timeEstimate: '15분',
    quote: '“그가 누구이든, 내 삶의 반경 밖으로 나갈 수는 없다.”',
    questions: [
      {
        key: 'sceneDesc',
        label: '1. 어떤 장면이었나요?',
        placeholder: '머릿속에 떠오른 특정 사건이나 장소, 대사를 간략히 적어주세요.',
      },
      {
        key: 'sceneReason',
        label: '2. 왜 기억에 남았나요?',
        placeholder: '이 장면이 유독 뇌리에 박힌 이유를 나눠주세요.',
      },
      {
        key: 'sceneFeeling',
        label: '3. 그 장면에서 어떤 감정을 느꼈나요?',
        placeholder: '당시 느꼈던 당혹감, 전율, 연민, 충격 등을 적어주세요.',
      },
    ],
    hostDiscussionPoints: [
      '진행자 화면에서 각 참가자가 꼽은 장면을 클릭하여 [오늘 이야기해볼 명장면]으로 선정해보세요.',
      '강민주와 백승하의 첫 대면, 납치 감금의 순간, 백승하의 심경 변화 등 주요 변곡점을 짚어봅니다.',
    ],
  },
  {
    id: 'deep_questions',
    orderNumber: '03',
    title: '5개의 질문으로 다시 보는 소설',
    subtitle: '인물과 서사의 이면을 파고드는 다섯 갈래의 시선',
    type: 'deep_questions',
    timeEstimate: '20분',
    quote: '“나를 가둔 세상에 질문을 던지지 않는다면, 나는 영원히 수형자일 뿐이다.”',
    questions: [
      {
        key: 'q1',
        label: 'Q1. 처음 강민주를 만났을 때 어떤 사람이라고 생각했나요?',
        placeholder: '소설 초반에 느껴진 강민주의 첫인상과 태도를 적어주세요.',
      },
      {
        key: 'q2',
        label: 'Q2. 읽으면서 강민주에 대한 생각이 달라진 순간이 있었나요?',
        placeholder: '그녀의 심리나 과거, 혹은 특정 행동을 보며 인식이 바뀐 순간을 적어주세요.',
      },
      {
        key: 'q3',
        label: 'Q3. 백승하는 단순한 피해자라고 생각했나요?',
        placeholder: '스타로서 남성 사회의 기득권을 체화한 인물인지, 순수한 희생양인지에 대한 생각.',
      },
      {
        key: 'q4',
        label: 'Q4. 가장 불편했던 인물이나 장면은 무엇이었나요?',
        placeholder: '읽는 내내 마음을 짓누르거나 거부감이 들었던 대목을 적어주세요.',
      },
      {
        key: 'q5',
        label: 'Q5. 이 소설에서 작가가 가장 이야기하고 싶었던 것은 무엇이라고 생각하나요?',
        placeholder: '양귀자 작가가 이 파격적인 서사를 통해 사회에 던지고자 했던 본질적 질문.',
      },
    ],
    hostDiscussionPoints: [
      'Q1부터 Q5까지 순차적으로 탭을 넘기며 5명의 생각을 비교합니다.',
      '강민주를 영웅으로 보는지, 왜곡된 신념의 파괴자로 보는지 관점의 차이를 짚어줍니다.',
    ],
  },
  {
    id: 'empathy_vote',
    orderNumber: '04',
    title: '강민주, 이해할 수 있는가?',
    subtitle: '억압에 맞서는 극단적 저항, 당신의 수용 온도는 몇 점입니까?',
    type: 'empathy_vote',
    timeEstimate: '15분',
    quote: '“목적이 숭고하다면, 그에 이르는 징벌은 정당화될 수 있는가?”',
    questions: [
      {
        key: 'score',
        label: '강민주의 행동을 어디까지 이해할 수 있는가? (0~10점)',
        description: '0점: 전혀 이해할 수 없다 / 10점: 충분히 이해할 수 있다',
      },
      {
        key: 'scoreReason',
        label: '이 점수를 매긴 이유를 간략히 적어주세요.',
        placeholder: '그녀의 분노에는 공감하지만 방식에 동의할 수 없는지, 혹은 전면적 지지인지 서술해주세요.',
      },
    ],
    hostDiscussionPoints: [
      '우리 5명의 평균 점수를 확인하고 점수 스펙트럼(최저점 vs 최고점)을 비교해봅니다.',
      '핵심 토론: "목적이 옳다면 수단도 정당화될 수 있을까?"',
      '추가 질문: "강민주의 행동은 폭력인가, 아니면 상징적 전복인가?"',
      '추가 질문: "피해자와 가해자의 위치는 상황과 권력 구조 속에서 항상 고정되어 있는가?"',
    ],
  },
  {
    id: 'power_shift',
    orderNumber: '05',
    title: '권력의 자리를 바꿔본다면?',
    subtitle: '강자와 약자의 위치가 역전될 때 마주하는 7가지 딜레마 사고실험',
    type: 'power_shift',
    timeEstimate: '15분',
    quote: '“내가 힘을 가졌을 때, 나는 이전의 나와 다른 사람이 될 수 있을까.”',
    questions: [
      {
        key: 'selectedCard',
        label: '상황 카드 (CARD 01 ~ CARD 07)',
        description: '랜덤으로 배정된 상황 카드를 읽고 나라면 어떻게 할지 선택해주세요.',
      },
      {
        key: 'judgment',
        label: '나라면 어떻게 할까? (선택)',
        placeholder: '상황에 맞는 나의 선택을 결정해주세요.',
      },
      {
        key: 'judgmentReason',
        label: '핵심 질문에 대한 생각과 선택한 이유를 작성해주세요.',
        placeholder: '권력의 성격, 정당한 응징과 복수의 차이, 또는 상대방의 선택권에 대한 나의 생각.',
      },
    ],
    hostDiscussionPoints: [
      '참가자들이 뽑은 7가지 상황 카드별 선택 비율과 팽팽한 이유를 비교합니다.',
      'CARD 05(자유 결정)와 소설 속 강민주의 백승하 감금 행동 사이의 연관성을 깊이 다룹니다.',
      '“과거의 피해가 현재 다른 이에게 행사할 수 있는 권력의 정당성이 되는가?”를 집중 논의합니다.',
    ],
  },
  {
    id: 'era_compare',
    orderNumber: '06',
    title: '1992 → 2026',
    subtitle: '34년의 세월을 건너온 질문, 오늘날의 시선으로 재독해하다',
    type: 'era_compare',
    timeEstimate: '15분',
    quote: '“시대는 변했는가, 아니면 금기(禁忌)의 형태만 바뀌었을 뿐인가.”',
    questions: [
      {
        key: 'issueCard',
        label: '진행자가 선정한 2026년의 사회적 이슈',
        description: '선정된 현대의 담론 키워드를 바탕으로 답해주세요.',
      },
      {
        key: 'eraReaction',
        label: '이 소설이 2026년에 처음 출간됐다면 어떤 반응을 얻었을까?',
        placeholder: 'SNS 반응, 미디어 비평, 대중의 여론, 법적 논란 등 오늘날 예상되는 반응을 자유롭게 상상해보세요.',
      },
    ],
    hostDiscussionPoints: [
      '[랜덤 이슈 뽑기] 버튼으로 현대 사회의 뜨거운 화두를 소환합니다.',
      '디지털 성범죄, 젠더 갈등 등 1992년에는 상상하지 못했던 새로운 형태의 권력 관계를 짚어봅니다.',
    ],
  },
  {
    id: 'forbidden_choice',
    orderNumber: '07',
    title: '금지된 선택',
    subtitle: '누군가의 희생을 전제로 한 복수, 당신이라면 방아쇠를 당길 것인가?',
    type: 'forbidden_choice',
    timeEstimate: '12분',
    quote: '“나는 오랫동안 부당한 대우를 받았다. 복수할 기회가 생겼다. 하지만 누군가가 피해를 입는다.”',
    questions: [
      {
        key: 'choice',
        label: '당신이라면 이 기회를 잡겠습니까?',
        options: [
          '한다',
          '하지 않는다',
          '상황에 따라 다르다',
        ],
      },
      {
        key: 'choiceReason',
        label: '선택의 이유를 적어주세요. (정답은 없습니다)',
        placeholder: '정의의 실현과 무고한 피해 사이에서 내가 기준 삼은 가치는 무엇인가요?',
      },
    ],
    hostDiscussionPoints: [
      '선택의 비율을 확인하고 서로의 경계선을 공유합니다.',
      '강민주가 끝내 마주해야 했던 비극의 무게와 연결지어 토론합니다.',
    ],
  },
  {
    id: 'desired_ending',
    orderNumber: '08',
    title: '내가 원하는 결말',
    subtitle: '원작의 충격적인 마침표 너머, 독자로서 꿈꾼 또 다른 종착지',
    type: 'desired_ending',
    timeEstimate: '18분',
    quote: '“이야기는 작가가 시작하지만, 결말의 의미를 완성하는 것은 독자다.”',
    questions: [
      {
        key: 'satisfaction',
        label: '이 소설의 원작 결말이 마음에 들었나요?',
        options: [
          '좋았다',
          '아쉬웠다',
          '마음에 들지 않았다',
          '판단하기 어렵다',
        ],
      },
      {
        key: 'direction',
        label: '나라면 결말의 방향을 어떻게 바꿨을까?',
        options: [
          'A. 강민주가 처벌받는다.',
          'B. 강민주가 자신의 행동을 후회한다.',
          'C. 백승하가 강민주를 이해하게 된다.',
          'D. 두 사람이 전혀 예상하지 못한 관계가 된다.',
          'E. 완전히 새로운 결말을 만든다.',
        ],
      },
      {
        key: 'customEnding',
        label: '내가 작가라면 이렇게 끝냈을 것이다.',
        placeholder: '내가 구상한 새로운 엔딩 씬이나 대사를 자유롭고 생생하게 서술해주세요.',
      },
    ],
    hostDiscussionPoints: [
      '5명이 다시 쓴 결말의 다양성을 감상해보세요.',
      '양귀자 작가가 왜 강민주의 죽음이라는 극단적인 마침표를 찍었을지 그 문학적 의도를 음미합니다.',
    ],
  },
  {
    id: 'if_i_were',
    orderNumber: '09',
    title: '나라면 이렇게 했다',
    subtitle: '강민주라는 인물에 나를 대입했을 때 발견한 나의 본질',
    type: 'if_i_were',
    timeEstimate: '12분',
    quote: '“타인의 선택을 비판하기는 쉽지만, 그 자리에 서는 순간 모든 것은 흔들린다.”',
    questions: [
      {
        key: 'whatIDo',
        label: '만약 내가 강민주의 입장이었다면? 나는 무엇을 다르게 했을까?',
        placeholder: '사회적 분노와 결핍을 해소하기 위해 나라면 어떤 경로를 택했을지 적어주세요.',
      },
      {
        key: 'diffChoice',
        label: '내가 강민주와 가장 달랐던 선택은 무엇인가?',
        placeholder: '그녀와 나의 결정적 차이점이 된 신념이나 가치관에 대해 적어주세요.',
      },
    ],
    hostDiscussionPoints: [
      '우리가 현실에서 타협하는 지점과 소설 속 인물이 질주한 지점의 간극을 짚어봅니다.',
    ],
  },
  {
    id: 'what_i_wish',
    orderNumber: '10',
    title: '나는 무엇을 소망하는가',
    subtitle: '금지된 것을 욕망했던 강민주를 지나, 이제 나의 갈망을 고백할 시간',
    type: 'what_i_wish',
    timeEstimate: '15분',
    quote: '“나는 소망한다. 내게 금지된 것을.”',
    questions: [
      {
        key: 'myWish',
        label: '문장 완성: "내가 지금 소망하는 것은 __________이다."',
        placeholder: '사회적 금기, 현실적 제약, 혹은 내면의 두려움 때문에 감춰둔 진실한 갈망을 채워주세요.',
      },
      {
        key: 'oneSentence',
        label: '오늘 이 책을 한 문장으로 표현한다면?',
        placeholder: '2시간의 깊은 대화를 마친 후 마음속에 남은 단 하나의 문장.',
      },
    ],
    hostDiscussionPoints: [
      '마지막 대화: 5명의 마지막 소망 문장과 한 줄 평을 모아 음미합니다.',
      '진행자는 [최종 기록 보기]로 넘어가 오늘 모임의 모든 궤적을 갈무리합니다.',
    ],
  },
];

// Situation cards for Activity 05
export interface SituationCard {
  id: string;
  cardNumber: string; // 'CARD 01'
  letter: string; // '01' ~ '07'
  title: string;
  situation: string;
  options: string[];
  coreQuestion: string;
  note?: string;
}

export const SITUATION_CARDS: SituationCard[] = [
  {
    id: 'sit_01',
    cardNumber: 'CARD 01',
    letter: '01',
    title: '내가 상사가 된다면',
    situation:
      '나는 회사에서 오랫동안 상사에게 무시당하고 부당한 대우를 받아왔다.\n\n그런데 몇 년 뒤 내가 그 상사의 상사가 되었다.\n\n그 사람이 예전처럼 나를 대하지는 않지만, 나는 그 사람이 과거에 했던 일을 모두 알고 있다.\n\n이번 인사평가에서 그 사람을 낮게 평가하면 승진에서 탈락한다.\n\n나라면 어떻게 할까?',
    options: [
      '① 과거의 일을 생각해 낮게 평가한다.',
      '② 과거와 상관없이 현재의 업무만 평가한다.',
      '③ 과거의 행동까지 평가에 반영한다.',
      '④ 내가 받은 만큼 돌려주고 싶을 것 같다.',
    ],
    coreQuestion: '내가 당했던 일을 되돌려주는 것은 정당한 응징일까, 개인적인 복수일까?',
  },
  {
    id: 'sit_02',
    cardNumber: 'CARD 02',
    letter: '02',
    title: '내가 면접관이라면',
    situation:
      '한 회사의 면접관이 되었다.\n\n내 앞에 두 명의 지원자가 있다.\n\n한 명은 능력과 경력이 더 뛰어나지만, 과거에 회사에서 문제가 있었던 사람이다.\n\n다른 한 명은 능력은 조금 부족하지만 성실하고 평판이 좋다.\n\n그런데 나는 첫 번째 지원자가 과거에 나와 같은 성별의 사람들을 무시했던 사실을 알고 있다.\n\n나라면 누구를 뽑을까?',
    options: [
      '① 능력이 뛰어난 사람',
      '② 성실하고 평판이 좋은 사람',
      '③ 과거의 행동까지 고려해 판단한다',
      '④ 판단하기 어렵다',
    ],
    coreQuestion: '권력을 가진 사람에게 \'공정한 판단\'이란 무엇일까?',
  },
  {
    id: 'sit_03',
    cardNumber: 'CARD 03',
    letter: '03',
    title: '남녀의 위치가 뒤바뀐다면',
    situation:
      '어떤 사회에서 여성이 사회의 대부분의 권력을 가지고 있고, 남성은 중요한 의사결정에서 배제되어 있다.\n\n남성이 자신의 권리를 주장하자 여성들은 말한다.\n\n"지금까지 우리가 얼마나 차별받았는지 알아?\n이제는 우리가 권력을 가져도 되는 거 아니야?"\n\n당신은 그 사회에서 권력을 가진 여성이다.\n\n그런데 어느 날 한 남성이 당신에게 말한다.\n\n"너희가 과거에 당했던 일을 우리가 왜 책임져야 해?"\n\n나라면 어떻게 대답할까?',
    options: [
      '① 우리도 당했으니 너희도 감수해야 한다.',
      '② 과거와 현재는 구분해야 한다.',
      '③ 지금부터라도 권력을 나눠야 한다.',
      '④ 쉽게 판단할 수 없다.',
    ],
    coreQuestion: '과거의 억압을 바로잡기 위해 현재의 권력 불균형을 어느 정도까지 허용할 수 있을까?',
  },
  {
    id: 'sit_04',
    cardNumber: 'CARD 04',
    letter: '04',
    title: '내가 유명한 사람이 된다면',
    situation:
      '나는 오랫동안 사회적으로 무시당하던 사람이었다.\n\n그런데 어느 순간 유명인이 되어 많은 사람들이 내 말을 듣기 시작했다.\n\n나를 무시했던 사람들이 이제는 나에게 잘 보이려고 한다.\n\n어느 날 과거에 나를 괴롭혔던 사람이 도움을 요청한다.\n\n내가 도와주지 않아도 아무도 나를 비난하지 않을 상황이다.\n\n나라면?',
    options: [
      '① 절대 도와주지 않는다.',
      '② 내가 당했던 일을 생각해서 거절한다.',
      '③ 과거와 상관없이 도와준다.',
      '④ 도와주되 쉽게 용서하지는 않는다.',
    ],
    coreQuestion: '약자의 위치에 있을 때와 권력을 가진 뒤의 나는 같은 사람일까?',
  },
  {
    id: 'sit_05',
    cardNumber: 'CARD 05',
    letter: '05',
    title: '내가 누군가의 자유를 결정할 수 있다면',
    situation:
      '나는 어떤 사람의 행동이 그 사람 자신에게도, 주변 사람에게도 위험하다고 생각한다.\n\n나는 그 사람보다 훨씬 많은 정보와 권한을 가지고 있다.\n\n그래서 내가 판단해서 그 사람의 행동을 제한하면 위험을 막을 수 있다.\n\n하지만 그 사람은 자신의 선택을 스스로 결정할 권리가 있다고 주장한다.\n\n나라면?',
    options: [
      '① 위험을 막기 위해 제한한다.',
      '② 아무리 위험해도 본인의 선택을 존중한다.',
      '③ 일정한 조건에서만 제한한다.',
      '④ 내가 판단할 수 있는 문제가 아니라고 생각한다.',
    ],
    coreQuestion: '누군가를 보호하기 위해 그 사람의 자유를 빼앗을 수 있을까?',
    note: '소설 속 “강민주가 백승하의 자유를 빼앗는 것”과 바로 연결되는 딜레마',
  },
  {
    id: 'sit_06',
    cardNumber: 'CARD 06',
    letter: '06',
    title: '내가 복수할 수 있는 힘을 갖게 된다면',
    situation:
      '나는 오랫동안 한 집단에게 차별받았다.\n\n그 집단 때문에 내가 원하는 기회를 얻지 못했고, 그동안 많은 것을 포기해야 했다.\n\n그런데 지금 나는 그 집단의 사람들을 선발하고 평가할 수 있는 위치에 있다.\n\n내가 결정하면 그들에게 불이익을 줄 수 있다.\n\n그리고 사람들은 말한다.\n\n"그 정도는 당해도 싸잖아.\n네가 그동안 당한 걸 생각해."\n\n나라면 어떻게 할까?',
    options: [
      '① 똑같이 돌려준다.',
      '② 더 심하게 돌려준다.',
      '③ 개인별로 판단한다.',
      '④ 아예 권력을 사용하지 않는다.',
    ],
    coreQuestion: '내가 당한 부당함은 다른 사람에게 부당하게 행동할 권리가 될 수 있을까?',
  },
  {
    id: 'sit_07',
    cardNumber: 'CARD 07',
    letter: '07',
    title: '내가 \'옳은 사람\'이라고 확신한다면',
    situation:
      '나는 내가 정의로운 일을 하고 있다고 확신한다.\n\n상대방은 잘못된 생각을 가지고 있고, 내가 그 사람을 통제하는 것이 결국 더 나은 결과를 만들 것이라고 믿는다.\n\n주변 사람들도 말한다.\n\n"네가 옳아. 그러니까 네가 결정해."\n\n하지만 문제는, 상대방은 내가 옳다고 생각하는 방식으로 살고 싶어 하지 않는다.\n\n나라면 어디까지 개입할까?',
    options: [
      '① 옳다고 확신한다면 강하게 개입한다.',
      '② 설득까지만 한다.',
      '③ 상대방의 선택을 존중한다.',
      '④ 결과가 좋다면 어느 정도 강제도 가능하다.',
    ],
    coreQuestion: '“내가 옳다”는 확신이 다른 사람을 통제할 권리가 될 수 있을까?',
  },
];

// 2026 Issue cards for Activity 06
export interface IssueCard {
  id: string;
  keyword: string;
  context: string;
}

export const ISSUE_CARDS: IssueCard[] = [
  { id: 'iss_1', keyword: '온라인 성별 갈등', context: '커뮤니티와 알고리즘이 증폭시킨 극단적 대립과 혐오의 언어' },
  { id: 'iss_2', keyword: '딥페이크와 디지털 성범죄', context: '가상 기술을 통해 대상화되고 착취당하는 신체와 인격' },
  { id: 'iss_3', keyword: '여성의 이미지와 미디어', context: '소비되는 시선과 주체적 재현 사이의 끊임없는 투쟁' },
  { id: 'iss_4', keyword: '남녀의 권력관계', context: '제도적 평등 뒤에 은폐된 일상적·심리적 권력의 불균형' },
  { id: 'iss_5', keyword: '피해자에 대한 사회적 시선', context: '‘완벽한 피해자’만을 요구하는 잔혹한 도덕적 잣대' },
  { id: 'iss_6', keyword: '유명인과 대중의 관계', context: '우상화와 즉각적 파멸의 롤러코스터에 놓인 스타의 딜레마' },
  { id: 'iss_7', keyword: 'SNS 시대의 성별 갈등', context: '좋아요와 조회수가 이끄는 분노 비즈니스와 담론의 양극화' },
];

export const DEFAULT_SESSION_ID = '20260905-yanggwija';
export const DEFAULT_SESSION_NAME = '2026년 9월 5일 양귀자 독서모임';
