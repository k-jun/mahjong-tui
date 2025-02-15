import { Pai } from "@k-jun/mahjong";

export const pais: Pai[] = [
  new Pai(0), // m1
  new Pai(1), // m1
  new Pai(2), // m1
  new Pai(3), // m1
  new Pai(4), // m2
  new Pai(5), // m2
  new Pai(6), // m2
  new Pai(7), // m2
  new Pai(8), // m3
  new Pai(9), // m3
  new Pai(10), // m3
  new Pai(11), // m3
  new Pai(12), // m4
  new Pai(13), // m4
  new Pai(14), // m4
  new Pai(15), // m4
  new Pai(16), // mr
  new Pai(17), // m5
  new Pai(18), // m5
  new Pai(19), // m5
  new Pai(20), // m6
  new Pai(21), // m6
  new Pai(22), // m6
  new Pai(23), // m6
  new Pai(24), // m7
  new Pai(25), // m7
  new Pai(26), // m7
  new Pai(27), // m7
  new Pai(28), // m8
  new Pai(29), // m8
  new Pai(30), // m8
  new Pai(31), // m8
  new Pai(32), // m9
  new Pai(33), // m9
  new Pai(34), // m9
  new Pai(35), // m9
  new Pai(36), // p1
  new Pai(37), // p1
  new Pai(38), // p1
  new Pai(39), // p1
  new Pai(40), // p2
  new Pai(41), // p2
  new Pai(42), // p2
  new Pai(43), // p2
  new Pai(44), // p3
  new Pai(45), // p3
  new Pai(46), // p3
  new Pai(47), // p3
  new Pai(48), // p4
  new Pai(49), // p4
  new Pai(50), // p4
  new Pai(51), // p4
  new Pai(52), // pr
  new Pai(53), // p5
  new Pai(54), // p5
  new Pai(55), // p5
  new Pai(56), // p6
  new Pai(57), // p6
  new Pai(58), // p6
  new Pai(59), // p6
  new Pai(60), // p7
  new Pai(61), // p7
  new Pai(62), // p7
  new Pai(63), // p7
  new Pai(64), // p8
  new Pai(65), // p8
  new Pai(66), // p8
  new Pai(67), // p8
  new Pai(68), // p9
  new Pai(69), // p9
  new Pai(70), // p9
  new Pai(71), // p9
  new Pai(72), // s1
  new Pai(73), // s1
  new Pai(74), // s1
  new Pai(75), // s1
  new Pai(76), // s2
  new Pai(77), // s2
  new Pai(78), // s2
  new Pai(79), // s2
  new Pai(80), // s3
  new Pai(81), // s3
  new Pai(82), // s3
  new Pai(83), // s3
  new Pai(84), // s4
  new Pai(85), // s4
  new Pai(86), // s4
  new Pai(87), // s4
  new Pai(88), // sr
  new Pai(89), // s5
  new Pai(90), // s5
  new Pai(91), // s5
  new Pai(92), // s6
  new Pai(93), // s6
  new Pai(94), // s6
  new Pai(95), // s6
  new Pai(96), // s7
  new Pai(97), // s7
  new Pai(98), // s7
  new Pai(99), // s7
  new Pai(100), // s8
  new Pai(101), // s8
  new Pai(102), // s8
  new Pai(103), // s8
  new Pai(104), // s9
  new Pai(105), // s9
  new Pai(106), // s9
  new Pai(107), // s9
  new Pai(108), // z1 東
  new Pai(109), // z1
  new Pai(110), // z1
  new Pai(111), // z1
  new Pai(112), // z2 南
  new Pai(113), // z2
  new Pai(114), // z2
  new Pai(115), // z2
  new Pai(116), // z3 西
  new Pai(117), // z3
  new Pai(118), // z3
  new Pai(119), // z3
  new Pai(120), // z4 北
  new Pai(121), // z4
  new Pai(122), // z4
  new Pai(123), // z4
  new Pai(124), // z5 白
  new Pai(125), // z5
  new Pai(126), // z5
  new Pai(127), // z5
  new Pai(128), // z6 発
  new Pai(129), // z6
  new Pai(130), // z6
  new Pai(131), // z6
  new Pai(132), // z7 中
  new Pai(133), // z7
  new Pai(134), // z7
  new Pai(135), // z7
];

export class Mahjong {
  pais: Pai[];
  constructor() {
    this.pais = [];
  }
}


// yama
// kawa
// wanpai
// hanpai
// nakpai
// tokuten